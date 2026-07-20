import type { Database } from "@acra/database";

import type { NormalizedStaticFinding } from "../analyzers/normalize-eslint-findings.js";
import type { WorkerSupabaseClient } from "../lib/supabase.js";

type PublicFunctions =
  Database["public"]["Functions"];

type ReplaceStaticFindingsFunction =
  PublicFunctions["replace_static_findings_for_file"];

type ReplaceStaticFindingsArgs =
  ReplaceStaticFindingsFunction["Args"];

type PersistStaticFindingsInput = {
  reviewId: string;
  fileId: string;
  userId: string;
  findings: readonly NormalizedStaticFinding[];
};

function createPersistenceArguments(
  input: PersistStaticFindingsInput,
): ReplaceStaticFindingsArgs {
  const targetFindings: ReplaceStaticFindingsArgs["target_findings"] =
    input.findings.map(
      ({ finding, fingerprint }) => ({
        rule_id: finding.ruleId ?? null,
        category: finding.category,
        severity: finding.severity,
        confidence: finding.confidence,
        title: finding.title,
        explanation: finding.explanation,
        suggested_fix: finding.suggestedFix,
        replacement_code:
          finding.replacementCode ?? null,
        line_start: finding.lineStart ?? null,
        line_end: finding.lineEnd ?? null,
        fingerprint,
      }),
    );

  return {
    target_review_id: input.reviewId,
    target_file_id: input.fileId,
    target_user_id: input.userId,
    target_findings: targetFindings,
  };
}

export async function persistStaticFindingsForFile(
  supabase: WorkerSupabaseClient,
  input: PersistStaticFindingsInput,
): Promise<number> {
  const uniqueFingerprints = new Set(
    input.findings.map(
      (normalizedFinding) =>
        normalizedFinding.fingerprint,
    ),
  );

  if (
    uniqueFingerprints.size !==
    input.findings.length
  ) {
    throw new Error(
      [
        "Static findings contain duplicate fingerprints.",
        `Unique: ${uniqueFingerprints.size}.`,
        `Total: ${input.findings.length}.`,
      ].join(" "),
    );
  }

  const argumentsForRpc =
    createPersistenceArguments(input);

  const { data, error } = await supabase.rpc(
    "replace_static_findings_for_file",
    argumentsForRpc,
  );

  if (error) {
    throw new Error(
      `Unable to persist static findings: ${error.message}`,
    );
  }

  if (
    typeof data !== "number" ||
    !Number.isInteger(data) ||
    data < 0
  ) {
    throw new Error(
      "Static findings RPC returned an invalid inserted count",
    );
  }

  if (data !== input.findings.length) {
    throw new Error(
      [
        "Static finding persistence count mismatch.",
        `Expected ${input.findings.length},`,
        `received ${data}.`,
      ].join(" "),
    );
  }

  return data;
}