import { z } from "zod";

export const reviewInputTypeSchema = z.enum(["paste", "upload"]);

export const reviewStatusSchema = z.enum([
  "draft",
  "queued",
  "static_analysis",
  "ai_analysis",
  "completed",
  "failed",
]);

export const supportedLanguageSchema = z.enum([
  "javascript",
  "jsx",
  "typescript",
  "tsx",
  "python",
]);

export const reviewFocusSchema = z.enum([
  "full",
  "bugs",
  "security",
  "performance",
  "maintainability",
  "documentation",
]);

export const findingSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const findingCategorySchema = z.enum([
  "bug",
  "security",
  "performance",
  "maintainability",
  "best-practice",
  "documentation",
  "style",
  "complexity",
]);

export const findingSourceSchema = z.enum(["static", "ai"]);

export type ReviewInputType = z.infer<typeof reviewInputTypeSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type SupportedLanguage = z.infer<typeof supportedLanguageSchema>;
export type ReviewFocus = z.infer<typeof reviewFocusSchema>;
export type FindingSeverity = z.infer<typeof findingSeveritySchema>;
export type FindingCategory = z.infer<typeof findingCategorySchema>;
export type FindingSource = z.infer<typeof findingSourceSchema>;