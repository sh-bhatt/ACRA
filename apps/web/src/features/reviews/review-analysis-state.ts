import type {
  StaticReviewScoreBreakdown,
} from "@acra/review-schema";

export type ReviewProcessingStatus =
  | "draft"
  | "queued"
  | "static_analysis"
  | "ai_analysis"
  | "completed"
  | "failed";

export type ReviewAnalysisFinding = {
  id: string;
  fileId: string;
  fileName: string;
  source: string;
  ruleId: string | null;
  category: string;
  severity: string;
  title: string;
  explanation: string;
  suggestedFix: string | null;
  replacementCode: string | null;
  lineStart: number | null;
  lineEnd: number | null;
};

export type ReviewComplexityMetrics = {
  id: string;
  fileId: string;
  fileName: string;
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  functionCount: number;
  classCount: number;
  importCount: number;
  cyclomaticComplexity: number;
  maximumNestingDepth: number;
  averageFunctionLength: number;
  maximumFunctionLength: number;
  maintainabilityScore: number;
};

export type ReviewAnalysisSnapshot = {
  review: {
    id: string;
    name: string;
    status: ReviewProcessingStatus;
    retryCount: number;
    errorMessage: string | null;
    overallScore: number | null;
    scoreBreakdown:
      StaticReviewScoreBreakdown | null;
  };
  findings: ReviewAnalysisFinding[];
  complexityMetrics: ReviewComplexityMetrics[];
};

export type ReviewAnalysisSnapshotResult =
  | {
      ok: true;
      data: ReviewAnalysisSnapshot;
    }
  | {
      ok: false;
      message: string;
    };