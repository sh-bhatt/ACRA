import { createHash } from "node:crypto";

import { z } from "zod";

import {
  analyzeSourceWithEslint,
  eslintSupportedLanguageSchema,
} from "../analyzers/eslint-analyzer.js";
import { normalizeEslintFindings } from "../analyzers/normalize-eslint-findings.js";
import { persistStaticFindingsForFile } from "../findings/persist-static-findings.js";
import type { WorkerSupabaseClient } from "../lib/supabase.js";
import { finalizeStaticAnalysisJob } from "../reviews/finalize-static-analysis.js";
import { ensureReviewStaticAnalysisStatus } from "../reviews/review-status.js";

const reviewAnalysisMessageSchema = z
  .object({
    version: z.literal(1),
    jobType: z.literal("static-analysis"),
    reviewId: z.string().uuid(),
    userId: z.string().uuid(),
    queuedAt: z.string().datetime({
      offset: true,
    }),
  })
  .strict();

const claimedQueueRowSchema = z
  .object({
    msg_id: z.coerce
      .number()
      .int()
      .positive(),

    read_ct: z.coerce
      .number()
      .int()
      .nonnegative(),

    message: z.unknown(),
  })
  .passthrough();

type ReviewAnalysisMessage = z.infer<
  typeof reviewAnalysisMessageSchema
>;

function formatZodError(
  error: z.ZodError,
): string {
  return error.issues
    .map((issue) => {
      const path =
        issue.path.length > 0
          ? issue.path.join(".")
          : "value";

      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function getFirstQueueRow(
  value: unknown,
): unknown | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseQueueMessage(
  value: unknown,
): ReviewAnalysisMessage {
  let normalizedValue = value;

  if (typeof value === "string") {
    try {
      normalizedValue = JSON.parse(
        value,
      ) as unknown;
    } catch {
      throw new Error(
        "Queue message contains invalid JSON",
      );
    }
  }

  const result =
    reviewAnalysisMessageSchema.safeParse(
      normalizedValue,
    );

  if (!result.success) {
    throw new Error(
      `Invalid queue message: ${formatZodError(
        result.error,
      )}`,
    );
  }

  return result.data;
}

function calculateSha256(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

export async function claimAndRunStaticAnalysisJob(
  supabase: WorkerSupabaseClient,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    "read_review_analysis_job",
    {
      visibility_timeout_seconds: 120,
    },
  );

  if (error) {
    throw new Error(
      `Unable to claim queue job: ${error.message}`,
    );
  }

  const rawQueueRow = getFirstQueueRow(data);

  if (rawQueueRow === null) {
    console.log(
      "[queue] no visible review-analysis job found",
    );

    return;
  }

  const parsedQueueRow =
    claimedQueueRowSchema.safeParse(
      rawQueueRow,
    );

  if (!parsedQueueRow.success) {
    throw new Error(
      `Invalid claimed queue row: ${formatZodError(
        parsedQueueRow.error,
      )}`,
    );
  }

  const claimedJob = parsedQueueRow.data;

  const message = parseQueueMessage(
    claimedJob.message,
  );

  console.log(
    `[queue] claimed msg_id=${claimedJob.msg_id}`,
  );

  console.log(
    `[queue] read_count=${claimedJob.read_ct}`,
  );

  console.log(
    `[queue] review_id=${message.reviewId}`,
  );

  const {
    data: review,
    error: reviewError,
  } = await supabase
    .from("reviews")
    .select(
      "id,user_id,name,status,primary_language,file_count,total_lines",
    )
    .eq("id", message.reviewId)
    .eq("user_id", message.userId)
    .single();

  if (reviewError) {
    throw new Error(
      `Unable to fetch queued review: ${reviewError.message}`,
    );
  }

  const processableStatuses = [
    "queued",
    "static_analysis",
  ] as const;

  if (
    !processableStatuses.includes(
      review.status as (
        typeof processableStatuses
      )[number],
    )
  ) {
    throw new Error(
      [
        "Review is not available for static analysis.",
        `Current status: ${review.status}.`,
      ].join(" "),
    );
  }

  if (
    review.file_count < 1 ||
    review.file_count > 10
  ) {
    throw new Error(
      `Invalid review file count: ${review.file_count}`,
    );
  }

  const {
    data: files,
    error: filesError,
  } = await supabase
    .from("review_files")
    .select(
      "id,review_id,user_id,original_name,storage_path,language,size_bytes,line_count,code_hash,created_at",
    )
    .eq("review_id", review.id)
    .eq("user_id", message.userId)
    .order("created_at", {
      ascending: true,
    });

  if (filesError) {
    throw new Error(
      `Unable to fetch review files: ${filesError.message}`,
    );
  }

  if (files.length === 0) {
    throw new Error(
      "Queued review does not contain any files",
    );
  }

  if (files.length !== review.file_count) {
    throw new Error(
      [
        "Review file-count mismatch.",
        `Expected ${review.file_count},`,
        `received ${files.length}.`,
      ].join(" "),
    );
  }

  console.log(
    [
      `[review] name="${review.name}"`,
      `language=${review.primary_language}`,
      `files=${review.file_count}`,
      `lines=${review.total_lines}`,
    ].join(" "),
  );

  await ensureReviewStaticAnalysisStatus(
    supabase,
    message.reviewId,
    message.userId,
  );

  let totalNormalizedFindingCount = 0;
  let totalPersistedFindingCount = 0;

  for (const file of files) {
    const languageResult =
      eslintSupportedLanguageSchema.safeParse(
        file.language,
      );

    if (!languageResult.success) {
      throw new Error(
        [
          "ESLint does not support language",
          `"${file.language}" for`,
          `"${file.original_name}".`,
        ].join(" "),
      );
    }

    const {
      data: sourceFile,
      error: downloadError,
    } = await supabase.storage
      .from("review-source-files")
      .download(file.storage_path);

    if (downloadError) {
      throw new Error(
        [
          `Unable to download ${file.original_name}:`,
          downloadError.message,
        ].join(" "),
      );
    }

    const sourceText =
      await sourceFile.text();

    const downloadedSize =
      Buffer.byteLength(
        sourceText,
        "utf8",
      );

    const downloadedHash =
      calculateSha256(sourceText);

    if (
      downloadedSize !== file.size_bytes
    ) {
      throw new Error(
        [
          `Size mismatch for ${file.original_name}.`,
          `Expected ${file.size_bytes} bytes,`,
          `received ${downloadedSize} bytes.`,
        ].join(" "),
      );
    }

    if (
      downloadedHash !== file.code_hash
    ) {
      throw new Error(
        `SHA-256 mismatch for ${file.original_name}`,
      );
    }

    console.log(
      [
        `[source] verified "${file.original_name}"`,
        `language=${file.language}`,
        `bytes=${downloadedSize}`,
        `lines=${file.line_count}`,
        "sha256=matched",
      ].join(" "),
    );

    const analysisResult =
      await analyzeSourceWithEslint({
        fileName: file.original_name,
        language: languageResult.data,
        sourceText,
      });

    console.log(
      [
        `[eslint] analyzed "${analysisResult.fileName}"`,
        `errors=${analysisResult.errorCount}`,
        `warnings=${analysisResult.warningCount}`,
        `fatal=${analysisResult.fatalErrorCount}`,
        `issues=${analysisResult.issues.length}`,
      ].join(" "),
    );

    const detectedRuleIds = [
      ...new Set(
        analysisResult.issues.map(
          (issue) =>
            issue.ruleId ?? "parser-error",
        ),
      ),
    ];

    console.log(
      `[eslint] rules=${
        detectedRuleIds.length > 0
          ? detectedRuleIds.join(",")
          : "none"
      }`,
    );

    const normalizedFindings =
      normalizeEslintFindings({
        fileName: file.original_name,
        issues: analysisResult.issues,
      });

    if (
      normalizedFindings.length !==
      analysisResult.issues.length
    ) {
      throw new Error(
        [
          "Finding normalization mismatch for",
          `"${file.original_name}".`,
          `Expected ${analysisResult.issues.length},`,
          `received ${normalizedFindings.length}.`,
        ].join(" "),
      );
    }

    const severityCounts =
      normalizedFindings.reduce(
        (
          counts: Record<string, number>,
          normalizedFinding,
        ) => {
          const severity =
            normalizedFinding.finding.severity;

          counts[severity] =
            (counts[severity] ?? 0) + 1;

          return counts;
        },
        {},
      );

    const categoryCounts =
      normalizedFindings.reduce(
        (
          counts: Record<string, number>,
          normalizedFinding,
        ) => {
          const category =
            normalizedFinding.finding.category;

          counts[category] =
            (counts[category] ?? 0) + 1;

          return counts;
        },
        {},
      );

    console.log(
      [
        `[findings] normalized=${normalizedFindings.length}`,
        `severity=${JSON.stringify(severityCounts)}`,
        `category=${JSON.stringify(categoryCounts)}`,
      ].join(" "),
    );

    const uniqueFingerprints = new Set(
      normalizedFindings.map(
        (normalizedFinding) =>
          normalizedFinding.fingerprint,
      ),
    );

    if (
      uniqueFingerprints.size !==
      normalizedFindings.length
    ) {
      throw new Error(
        [
          "Duplicate finding fingerprints detected for",
          `"${file.original_name}".`,
          `Unique: ${uniqueFingerprints.size}.`,
          `Total: ${normalizedFindings.length}.`,
        ].join(" "),
      );
    }

    totalNormalizedFindingCount +=
      normalizedFindings.length;

    console.log(
      [
        "[findings] persistence starting",
        `file="${file.original_name}"`,
        `count=${normalizedFindings.length}`,
      ].join(" "),
    );

    const persistedFindingCount =
      await persistStaticFindingsForFile(
        supabase,
        {
          reviewId: review.id,
          fileId: file.id,
          userId: message.userId,
          findings: normalizedFindings,
        },
      );

    totalPersistedFindingCount +=
      persistedFindingCount;

    console.log(
      [
        `[findings] persisted=${persistedFindingCount}`,
        `file="${file.original_name}"`,
      ].join(" "),
    );
  }

  if (
    totalPersistedFindingCount !==
    totalNormalizedFindingCount
  ) {
    throw new Error(
      [
        "Review finding persistence mismatch.",
        `Normalized: ${totalNormalizedFindingCount}.`,
        `Persisted: ${totalPersistedFindingCount}.`,
      ].join(" "),
    );
  }

  console.log(
    [
      "[queue] static analysis completed successfully",
      `files=${files.length}`,
      `findings=${totalNormalizedFindingCount}`,
    ].join(" "),
  );

  console.log(
    [
      "[queue] static findings persisted successfully",
      `persisted=${totalPersistedFindingCount}`,
    ].join(" "),
  );

  /*
   * Finalization must remain after every file has been
   * analyzed and all findings have been persisted.
   *
   * The queue message must never be archived before this point.
   */
  await finalizeStaticAnalysisJob(
    supabase,
    {
      reviewId: review.id,
      userId: message.userId,
      messageId: claimedJob.msg_id,
    },
  );

  console.log(
    "[review] status transitioned static_analysis -> completed",
  );

  console.log(
    `[queue] archived msg_id=${claimedJob.msg_id}`,
  );

  console.log(
    "[queue] static-analysis job finalized successfully",
  );
}