import { z } from "zod";

import {
  findingCategorySchema,
  findingSeveritySchema,
  findingSourceSchema,
} from "./enums.js";

export const reviewFindingSchema = z
  .object({
    source: findingSourceSchema,

    ruleId: z.string().trim().min(1).max(150).optional(),

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

export type ReviewFinding = z.infer<typeof reviewFindingSchema>;