"use server";
import { revalidatePath } from "next/cache";

import type {
  QueueReviewActionState,
} from "@/features/reviews/queue-review-state";
import {
    createHash,
    randomUUID,
} from "node:crypto";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
    REVIEW_FOCUS_VALUES,
} from "@/features/profile/profile-options";
import type {
    NewReviewActionState,
} from "@/features/reviews/new-review-state";
import {
    getLanguageExtension,
    PASTE_LANGUAGE_VALUES,
} from "@/features/reviews/review-options";
import { createClient } from "@/lib/supabase/server";

const queueReviewSchema = z.object({
  reviewId: z
    .string()
    .uuid("Invalid review identifier"),
});

const REVIEW_SOURCE_BUCKET =
    "review-source-files";

const MAXIMUM_FILE_SIZE_BYTES = 200_000;

const createPastedReviewSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Review name is required")
            .max(
                100,
                "Review name cannot exceed 100 characters",
            ),

        primaryLanguage: z.enum(
            PASTE_LANGUAGE_VALUES,
        ),

        reviewFocus: z
            .array(z.enum(REVIEW_FOCUS_VALUES))
            .min(1, "Select at least one review focus")
            .max(6),

        code: z
            .string()
            .min(1, "Paste some code to review")
            .max(
                200_000,
                "Code cannot exceed 200,000 characters",
            ),
    })
    .superRefine((input, context) => {
        if (input.code.trim().length === 0) {
            context.addIssue({
                code: "custom",
                path: ["code"],
                message: "Code cannot contain only whitespace",
            });
        }

        if (
            input.reviewFocus.includes("full") &&
            input.reviewFocus.length > 1
        ) {
            context.addIssue({
                code: "custom",
                path: ["reviewFocus"],
                message:
                    "Full review cannot be combined with individual focus areas",
            });
        }
    });

function getFirstValidationError(
    error: z.ZodError,
): string {
    return (
        error.issues[0]?.message ??
        "Please check the submitted review"
    );
}

export async function createPastedReviewAction(
    _previousState: NewReviewActionState,
    formData: FormData,
): Promise<NewReviewActionState> {
    const parsedInput =
        createPastedReviewSchema.safeParse({
            name: formData.get("name"),

            primaryLanguage:
                formData.get("primaryLanguage"),

            reviewFocus: formData
                .getAll("reviewFocus")
                .filter(
                    (value): value is string =>
                        typeof value === "string",
                ),

            code: formData.get("code"),
        });

    if (!parsedInput.success) {
        return {
            status: "error",
            message: getFirstValidationError(
                parsedInput.error,
            ),
        };
    }

    const {
        name,
        primaryLanguage,
        reviewFocus,
        code,
    } = parsedInput.data;

    const sizeBytes =
        Buffer.byteLength(code, "utf8");

    if (sizeBytes > MAXIMUM_FILE_SIZE_BYTES) {
        return {
            status: "error",
            message:
                "Submitted code cannot exceed 200 KB",
        };
    }

    const lineCount =
        code.split(/\r\n|\r|\n/).length;

    const codeHash = createHash("sha256")
        .update(code, "utf8")
        .digest("hex");

    const supabase = await createClient();

    const {
        data: claimsData,
        error: claimsError,
    } = await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
        return {
            status: "error",
            message:
                "Your session has expired. Please sign in again.",
        };
    }

    const {
        data: review,
        error: reviewError,
    } = await supabase
        .from("reviews")
        .insert({
            user_id: userId,
            name,
            input_type: "paste",
            primary_language: primaryLanguage,
            review_focus: reviewFocus,
        })
        .select("id")
        .single();

    if (reviewError || !review) {
        console.error(
            "Review creation failed:",
            reviewError?.message,
        );

        return {
            status: "error",
            message:
                "Unable to create the review right now.",
        };
    }

    const extension =
        getLanguageExtension(primaryLanguage);

    const originalName =
        `snippet.${extension}`;

    const storagePath = [
        userId,
        review.id,
        `${randomUUID()}.${extension}`,
    ].join("/");

    const sourceFile = new Blob(
        [code],
        {
            type: "text/plain",
        },
    );

    const { error: uploadError } =
        await supabase.storage
            .from(REVIEW_SOURCE_BUCKET)
            .upload(
                storagePath,
                sourceFile,
                {
                    contentType: "text/plain",
                    cacheControl: "0",
                    upsert: false,
                },
            );

    if (uploadError) {
        console.error("Source upload failed:", uploadError);

        await supabase
            .from("reviews")
            .delete()
            .eq("id", review.id)
            .eq("user_id", userId);

        return {
            status: "error",
            message:
                "Unable to securely store the submitted code.",
        };
    }

    const { error: fileRecordError } =
        await supabase
            .from("review_files")
            .insert({
                review_id: review.id,
                user_id: userId,
                original_name: originalName,
                storage_path: storagePath,
                language: primaryLanguage,
                size_bytes: sizeBytes,
                line_count: lineCount,
                code_hash: codeHash,
            });

    if (fileRecordError) {
        console.error(
            "File metadata creation failed:",
            fileRecordError.message,
        );

        await supabase.storage
            .from(REVIEW_SOURCE_BUCKET)
            .remove([storagePath]);

        await supabase
            .from("reviews")
            .delete()
            .eq("id", review.id)
            .eq("user_id", userId);

        return {
            status: "error",
            message:
                "Unable to complete the review draft.",
        };
    }

    redirect(`/reviews/${review.id}`);
}
export async function queueReviewAction(
  _previousState: QueueReviewActionState,
  formData: FormData,
): Promise<QueueReviewActionState> {
  const parsedInput = queueReviewSchema.safeParse({
    reviewId: formData.get("reviewId"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message:
        parsedInput.error.issues[0]?.message ??
        "Invalid review",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc(
    "enqueue_review_analysis",
    {
      target_review_id:
        parsedInput.data.reviewId,
    },
  );

  if (error) {
    console.error(
      "Unable to queue review:",
      error,
    );

    return {
      status: "error",
      message:
        "Unable to queue this review. Check that no other analysis is currently running.",
    };
  }

  revalidatePath(
    `/reviews/${parsedInput.data.reviewId}`,
  );

  redirect(
    `/reviews/${parsedInput.data.reviewId}?queued=success`,
  );
}