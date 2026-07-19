import { z } from "zod";

import {
  findingCategorySchema,
  findingSeveritySchema,
} from "./enums.js";

export const aiFindingSchema = z
  .object({
    title: z.string().trim().min(1).max(200),

    category: findingCategorySchema,

    severity: findingSeveritySchema,

    confidence: z.number().min(0).max(1),

    fileName: z.string().trim().min(1).max(255),

    lineStart: z.number().int().positive().optional(),

    lineEnd: z.number().int().positive().optional(),

    explanation: z.string().trim().min(1).max(5_000),

    suggestedFix: z.string().trim().min(1).max(10_000),

    replacementCode: z.string().max(20_000).optional(),
  })
  .superRefine((finding, context) => {
    if (
      finding.lineStart !== undefined &&
      finding.lineEnd !== undefined &&
      finding.lineEnd < finding.lineStart
    ) {
      context.addIssue({
        code: "custom",
        path: ["lineEnd"],
        message: "Ending line cannot be before the starting line",
      });
    }
  });

export const aiReviewResultSchema = z.object({
  summary: z.string().trim().min(1).max(5_000),

  strengths: z.array(z.string().trim().min(1).max(500)).max(10),

  findings: z.array(aiFindingSchema).max(100),

  refactoringPlan: z
    .array(z.string().trim().min(1).max(1_000))
    .max(15),

  generatedDocumentation: z.string().max(20_000).optional(),
});

export type AIFinding = z.infer<typeof aiFindingSchema>;
export type AIReviewResult = z.infer<typeof aiReviewResultSchema>;