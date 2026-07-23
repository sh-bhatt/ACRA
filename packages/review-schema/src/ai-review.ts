import { z } from "zod";

import {
  findingCategorySchema,
  findingSeveritySchema,
} from "./enums.js";

const nullablePositiveIntegerSchema =
  z
    .number()
    .int()
    .positive()
    .nullable();

const nullableReplacementCodeSchema =
  z
    .string()
    .max(20_000)
    .nullable();

export const aiFindingStructuredOutputSchema =
  z
    .object({
      title: z
        .string()
        .min(1)
        .max(200),

      category:
        findingCategorySchema,

      severity:
        findingSeveritySchema,

      confidence: z
        .number()
        .min(0)
        .max(1),

      fileName: z
        .string()
        .min(1)
        .max(255),

      lineStart:
        nullablePositiveIntegerSchema,

      lineEnd:
        nullablePositiveIntegerSchema,

      explanation: z
        .string()
        .min(1)
        .max(5_000),

      suggestedFix: z
        .string()
        .min(1)
        .max(10_000),

      replacementCode:
        nullableReplacementCodeSchema,
    })
    .strict();

export const aiFindingSchema =
  aiFindingStructuredOutputSchema
    .superRefine(
      (finding, context) => {
        if (
          finding.lineStart !== null &&
          finding.lineEnd !== null &&
          finding.lineEnd <
            finding.lineStart
        ) {
          context.addIssue({
            code: "custom",
            path: ["lineEnd"],
            message:
              "Ending line cannot be before the starting line",
          });
        }
      },
    );

export const aiReviewStructuredOutputSchema =
  z
    .object({
      summary: z
        .string()
        .min(1)
        .max(5_000),

      strengths: z
        .array(
          z
            .string()
            .min(1)
            .max(500),
        )
        .max(10),

      findings: z
        .array(
          aiFindingStructuredOutputSchema,
        )
        .max(100),

      refactoringPlan: z
        .array(
          z
            .string()
            .min(1)
            .max(1_000),
        )
        .max(15),

      generatedDocumentation: z
        .string()
        .max(20_000)
        .nullable(),
    })
    .strict();

export const aiReviewResultSchema =
  aiReviewStructuredOutputSchema
    .superRefine(
      (review, context) => {
        review.findings.forEach(
          (finding, index) => {
            const result =
              aiFindingSchema.safeParse(
                finding,
              );

            if (!result.success) {
              for (
                const issue of
                result.error.issues
              ) {
                context.addIssue({
                  ...issue,
                  path: [
                    "findings",
                    index,
                    ...issue.path,
                  ],
                });
              }
            }
          },
        );
      },
    );

export type AIFinding =
  z.infer<
    typeof aiFindingSchema
  >;

export type AIReviewResult =
  z.infer<
    typeof aiReviewResultSchema
  >;