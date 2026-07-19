import { z } from "zod";

import {
  reviewFocusSchema,
  reviewInputTypeSchema,
  supportedLanguageSchema,
} from "./enums.js";

export const submittedCodeFileSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name is too long"),

  language: supportedLanguageSchema,

  content: z
    .string()
    .min(1, "Code cannot be empty")
    .max(200_000, "A file cannot contain more than 200,000 characters"),
});

export const createReviewInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Review name is required")
      .max(100, "Review name cannot exceed 100 characters"),

    inputType: reviewInputTypeSchema,

    primaryLanguage: supportedLanguageSchema,

    focus: z.array(reviewFocusSchema).min(1).max(6),

    files: z
      .array(submittedCodeFileSchema)
      .min(1, "At least one code file is required")
      .max(10, "A maximum of 10 files is allowed"),
  })
  .superRefine((review, context) => {
    const totalCharacters = review.files.reduce(
      (total, file) => total + file.content.length,
      0,
    );

    if (totalCharacters > 1_000_000) {
      context.addIssue({
        code: "custom",
        path: ["files"],
        message: "The complete review cannot exceed 1,000,000 characters",
      });
    }
  });

export type SubmittedCodeFile = z.infer<typeof submittedCodeFileSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;