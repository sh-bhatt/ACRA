import {
  calculateStaticReviewScoreInputSchema,
  staticReviewScoreBreakdownSchema,
  type ScoreFindingSeverity,
  type StaticReviewScoreBreakdown,
} from "@acra/review-schema";

const BASE_SCORE = 100;

const SEVERITY_DEDUCTION: Record<
  ScoreFindingSeverity,
  number
> = {
  critical: 15,
  high: 8,
  medium: 3,
  low: 1,
  info: 0,
};

const MAXIMUM_HIGH_COMPLEXITY_DEDUCTION =
  12;

const MAXIMUM_LONG_FUNCTION_DEDUCTION =
  10;

const MAXIMUM_NESTING_DEDUCTION = 10;

const MAXIMUM_DOCUMENTATION_DEDUCTION =
  6;

const MAXIMUM_DUPLICATE_DEDUCTION = 5;

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value),
  );
}

function calculateHighComplexityDeduction(
  input: {
    cyclomaticComplexity: number;
    functionCount: number;
  },
): number {
  const complexityDensity =
    input.cyclomaticComplexity /
    Math.max(1, input.functionCount);

  if (complexityDensity <= 6) {
    return 0;
  }

  return (
    Math.ceil(
      (complexityDensity - 6) / 2,
    ) * 2
  );
}

function calculateLongFunctionDeduction(
  maximumFunctionLength: number,
): number {
  if (maximumFunctionLength <= 50) {
    return 0;
  }

  return (
    Math.ceil(
      (
        maximumFunctionLength - 50
      ) / 25,
    ) * 2
  );
}

function calculateNestingDeduction(
  maximumNestingDepth: number,
): number {
  if (maximumNestingDepth <= 4) {
    return 0;
  }

  return (
    maximumNestingDepth - 4
  ) * 2;
}

function calculateMissingDocumentationDeduction(
  input: {
    linesOfCode: number;
    commentLines: number;
  },
): number {
  if (
    input.linesOfCode < 30 ||
    input.commentLines > 0
  ) {
    return 0;
  }

  return 3;
}

function calculateDuplicateFindingCount(
  fingerprints: readonly string[],
): number {
  const uniqueFingerprints =
    new Set(fingerprints);

  return Math.max(
    0,
    fingerprints.length -
      uniqueFingerprints.size,
  );
}

export function calculateStaticReviewScore(
  input: unknown,
): StaticReviewScoreBreakdown {
  const validatedInput =
    calculateStaticReviewScoreInputSchema.parse(
      input,
    );

  const severityCounts: Record<
    ScoreFindingSeverity,
    number
  > = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (
    const finding of
    validatedInput.findings
  ) {
    severityCounts[finding.severity] += 1;
  }

  const criticalDeduction =
    severityCounts.critical *
    SEVERITY_DEDUCTION.critical;

  const highDeduction =
    severityCounts.high *
    SEVERITY_DEDUCTION.high;

  const mediumDeduction =
    severityCounts.medium *
    SEVERITY_DEDUCTION.medium;

  const lowDeduction =
    severityCounts.low *
    SEVERITY_DEDUCTION.low;

  const infoDeduction =
    severityCounts.info *
    SEVERITY_DEDUCTION.info;

  const severityTotalDeduction =
    criticalDeduction +
    highDeduction +
    mediumDeduction +
    lowDeduction +
    infoDeduction;

  const rawHighComplexityDeduction =
    validatedInput.files.reduce(
      (total, file) => {
        return (
          total +
          calculateHighComplexityDeduction(
            file,
          )
        );
      },
      0,
    );

  const highComplexityDeduction =
    clamp(
      rawHighComplexityDeduction,
      0,
      MAXIMUM_HIGH_COMPLEXITY_DEDUCTION,
    );

  const rawLongFunctionDeduction =
    validatedInput.files.reduce(
      (total, file) => {
        return (
          total +
          calculateLongFunctionDeduction(
            file.maximumFunctionLength,
          )
        );
      },
      0,
    );

  const longFunctionDeduction =
    clamp(
      rawLongFunctionDeduction,
      0,
      MAXIMUM_LONG_FUNCTION_DEDUCTION,
    );

  const rawNestingDeduction =
    validatedInput.files.reduce(
      (total, file) => {
        return (
          total +
          calculateNestingDeduction(
            file.maximumNestingDepth,
          )
        );
      },
      0,
    );

  const excessiveNestingDeduction =
    clamp(
      rawNestingDeduction,
      0,
      MAXIMUM_NESTING_DEDUCTION,
    );

  const rawDocumentationDeduction =
    validatedInput.files.reduce(
      (total, file) => {
        return (
          total +
          calculateMissingDocumentationDeduction(
            file,
          )
        );
      },
      0,
    );

  const missingDocumentationDeduction =
    clamp(
      rawDocumentationDeduction,
      0,
      MAXIMUM_DOCUMENTATION_DEDUCTION,
    );

  const duplicateFindingCount =
    calculateDuplicateFindingCount(
      validatedInput.findings.map(
        (finding) =>
          finding.fingerprint,
      ),
    );

  const duplicateFindingDeduction =
    clamp(
      duplicateFindingCount,
      0,
      MAXIMUM_DUPLICATE_DEDUCTION,
    );

  const structuralTotalDeduction =
    highComplexityDeduction +
    longFunctionDeduction +
    excessiveNestingDeduction +
    missingDocumentationDeduction +
    duplicateFindingDeduction;

  const rawDeduction =
    severityTotalDeduction +
    structuralTotalDeduction;

  const appliedDeduction =
    clamp(
      rawDeduction,
      0,
      BASE_SCORE,
    );

  const overallScore =
    BASE_SCORE -
    appliedDeduction;

  return staticReviewScoreBreakdownSchema.parse(
    {
      version: 1,
      baseScore: BASE_SCORE,

      severity: {
        criticalCount:
          severityCounts.critical,

        highCount:
          severityCounts.high,

        mediumCount:
          severityCounts.medium,

        lowCount:
          severityCounts.low,

        infoCount:
          severityCounts.info,

        criticalDeduction,
        highDeduction,
        mediumDeduction,
        lowDeduction,
        infoDeduction,

        totalDeduction:
          severityTotalDeduction,
      },

      structural: {
        highComplexityDeduction,
        longFunctionDeduction,
        excessiveNestingDeduction,
        missingDocumentationDeduction,
        duplicateFindingDeduction,

        totalDeduction:
          structuralTotalDeduction,
      },

      rawDeduction,
      appliedDeduction,
      overallScore,
    },
  );
}