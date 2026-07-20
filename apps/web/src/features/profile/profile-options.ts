export const REVIEW_FOCUS_VALUES = [
  "full",
  "bugs",
  "security",
  "performance",
  "maintainability",
  "documentation",
] as const;

export type ReviewFocusValue =
  (typeof REVIEW_FOCUS_VALUES)[number];

export const REVIEW_FOCUS_OPTIONS: ReadonlyArray<{
  value: ReviewFocusValue;
  label: string;
  description: string;
}> = [
  {
    value: "full",
    label: "Full review",
    description: "Review all supported categories.",
  },
  {
    value: "bugs",
    label: "Bugs",
    description: "Find incorrect or risky behaviour.",
  },
  {
    value: "security",
    label: "Security",
    description: "Look for unsafe coding patterns.",
  },
  {
    value: "performance",
    label: "Performance",
    description: "Find unnecessary or expensive operations.",
  },
  {
    value: "maintainability",
    label: "Maintainability",
    description: "Improve readability and structure.",
  },
  {
    value: "documentation",
    label: "Documentation",
    description: "Improve comments and code explanations.",
  },
];