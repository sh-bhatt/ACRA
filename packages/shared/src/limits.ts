export const REVIEW_LIMITS = {
  maximumFilesPerReview: 10,
  maximumFileSizeBytes: 200_000,
  maximumTotalReviewSizeBytes: 1_000_000,
  maximumReviewNameLength: 100,

  dailyCompletedReviewsPerUser: 20,
  maximumActiveReviewsPerUser: 1,
  maximumQueuedReviewsPerUser: 3,
  maximumRetryAttemptsPerReview: 3,

  staticAnalysisTimeoutMs: 30_000,
  aiReviewTimeoutMs: 60_000,
} as const;