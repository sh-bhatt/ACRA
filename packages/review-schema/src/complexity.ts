import { z } from "zod";

export const complexityMetricsSchema = z.object({
  linesOfCode: z.number().int().nonnegative(),
  blankLines: z.number().int().nonnegative(),
  commentLines: z.number().int().nonnegative(),
  functionCount: z.number().int().nonnegative(),
  classCount: z.number().int().nonnegative(),
  importCount: z.number().int().nonnegative(),
  cyclomaticComplexity: z.number().nonnegative(),
  maximumNestingDepth: z.number().int().nonnegative(),
  averageFunctionLength: z.number().nonnegative(),
  maximumFunctionLength: z.number().int().nonnegative(),
  maintainabilityScore: z.number().min(0).max(100),
});

export type ComplexityMetrics = z.infer<typeof complexityMetricsSchema>;