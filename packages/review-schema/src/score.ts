import { z } from "zod";

import {
  complexityMetricsSchema,
} from "./complexity.js";

export const scoreFindingSeveritySchema =
  z.enum([
    "critical",
    "high",
    "medium",
    "low",
    "info",
  ]);

export const staticScoreFindingSchema =
  z
    .object({
      severity:
        scoreFindingSeveritySchema,

      fingerprint: z
        .string()
        .trim()
        .min(1),
    })
    .strict();

export const staticScoreFileMetricsSchema =
  complexityMetricsSchema.extend({
    fileId: z
      .string()
      .trim()
      .min(1),
  });

export const severityScoreBreakdownSchema =
  z
    .object({
      criticalCount: z
        .number()
        .int()
        .nonnegative(),

      highCount: z
        .number()
        .int()
        .nonnegative(),

      mediumCount: z
        .number()
        .int()
        .nonnegative(),

      lowCount: z
        .number()
        .int()
        .nonnegative(),

      infoCount: z
        .number()
        .int()
        .nonnegative(),

      criticalDeduction: z
        .number()
        .int()
        .nonnegative(),

      highDeduction: z
        .number()
        .int()
        .nonnegative(),

      mediumDeduction: z
        .number()
        .int()
        .nonnegative(),

      lowDeduction: z
        .number()
        .int()
        .nonnegative(),

      infoDeduction: z.literal(0),

      totalDeduction: z
        .number()
        .int()
        .nonnegative(),
    })
    .strict();

export const structuralScoreBreakdownSchema =
  z
    .object({
      highComplexityDeduction: z
        .number()
        .int()
        .nonnegative(),

      longFunctionDeduction: z
        .number()
        .int()
        .nonnegative(),

      excessiveNestingDeduction: z
        .number()
        .int()
        .nonnegative(),

      missingDocumentationDeduction: z
        .number()
        .int()
        .nonnegative(),

      duplicateFindingDeduction: z
        .number()
        .int()
        .nonnegative(),

      totalDeduction: z
        .number()
        .int()
        .nonnegative(),
    })
    .strict();

export const staticReviewScoreBreakdownSchema =
  z
    .object({
      version: z.literal(1),

      baseScore: z.literal(100),

      severity:
        severityScoreBreakdownSchema,

      structural:
        structuralScoreBreakdownSchema,

      rawDeduction: z
        .number()
        .int()
        .nonnegative(),

      appliedDeduction: z
        .number()
        .int()
        .min(0)
        .max(100),

      overallScore: z
        .number()
        .int()
        .min(0)
        .max(100),
    })
    .strict();

export const calculateStaticReviewScoreInputSchema =
  z
    .object({
      findings: z.array(
        staticScoreFindingSchema,
      ),

      files: z.array(
        staticScoreFileMetricsSchema,
      ),
    })
    .strict();

export type ScoreFindingSeverity =
  z.infer<
    typeof scoreFindingSeveritySchema
  >;

export type StaticScoreFinding =
  z.infer<
    typeof staticScoreFindingSchema
  >;

export type StaticScoreFileMetrics =
  z.infer<
    typeof staticScoreFileMetricsSchema
  >;

export type StaticReviewScoreBreakdown =
  z.infer<
    typeof staticReviewScoreBreakdownSchema
  >;

export type CalculateStaticReviewScoreInput =
  z.input<
    typeof calculateStaticReviewScoreInputSchema
  >;