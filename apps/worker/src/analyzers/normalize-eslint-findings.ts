import { createHash } from "node:crypto";

import {
  reviewFindingSchema,
  type FindingCategory,
  type FindingSeverity,
  type ReviewFinding,
} from "@acra/review-schema";

import type { EslintIssue } from "./eslint-analyzer.js";

export type NormalizedStaticFinding = {
  finding: ReviewFinding;
  fingerprint: string;
};

type NormalizeEslintFindingsInput = {
  fileName: string;
  issues: readonly EslintIssue[];
};

const RULE_TITLES: Readonly<Record<string, string>> = {
  "@typescript-eslint/no-unused-vars":
    "Unused variable or parameter",

  "@typescript-eslint/no-explicit-any":
    "Explicit any weakens type safety",

  "@typescript-eslint/no-unused-expressions":
    "Unused expression has no effect",

  "@typescript-eslint/no-array-constructor":
    "Avoid the Array constructor",

  "@typescript-eslint/no-non-null-assertion":
    "Unsafe non-null assertion",

  "@typescript-eslint/no-empty-object-type":
    "Ambiguous empty object type",

  "@typescript-eslint/no-unsafe-declaration-merging":
    "Unsafe declaration merging",

  "@typescript-eslint/no-wrapper-object-types":
    "Avoid wrapper object types",

  "@typescript-eslint/prefer-as-const":
    "Prefer a const assertion",

  eqeqeq:
    "Use strict equality",

  "no-await-in-loop":
    "Await inside a loop may reduce performance",

  "no-debugger":
    "Debugger statement left in source",

  "no-unsafe-optional-chaining":
    "Unsafe optional chaining",

  "no-var":
    "Use let or const instead of var",

  "prefer-const":
    "Variable can be declared with const",

  "parser-error":
    "Source code could not be parsed",
};

const SUGGESTED_FIXES: Readonly<Record<string, string>> = {
  "@typescript-eslint/no-unused-vars":
    "Remove the unused declaration, use it where intended, or prefix an intentionally unused parameter with an underscore.",

  "@typescript-eslint/no-explicit-any":
    "Replace any with a specific type, a generic constraint, or unknown followed by appropriate type narrowing.",

  "@typescript-eslint/no-unused-expressions":
    "Remove the unused expression or convert it into an explicit assignment, function call, or conditional statement.",

  "@typescript-eslint/no-array-constructor":
    "Use an array literal or an explicit typed array declaration instead of the Array constructor.",

  "@typescript-eslint/no-non-null-assertion":
    "Check the value for null or undefined and narrow its type before using it.",

  "@typescript-eslint/no-empty-object-type":
    "Replace the empty object type with a more precise object shape, object, unknown, or an appropriate record type.",

  "@typescript-eslint/no-unsafe-declaration-merging":
    "Rename or restructure the declarations so unrelated declarations are not merged unsafely.",

  "@typescript-eslint/no-wrapper-object-types":
    "Use primitive types such as string, number, boolean, symbol, or bigint instead of their wrapper object types.",

  "@typescript-eslint/prefer-as-const":
    "Use an as const assertion where the value should retain its narrow literal type.",

  eqeqeq:
    "Replace loose equality operators with strict equality operators and handle type conversion explicitly when necessary.",

  "no-await-in-loop":
    "Consider collecting independent promises and awaiting them together with Promise.all. Keep sequential awaits only when order is required.",

  "no-debugger":
    "Remove the debugger statement before shipping the code.",

  "no-unsafe-optional-chaining":
    "Add an explicit fallback or null check before using the result of optional chaining in an operation that requires a value.",

  "no-var":
    "Replace var with const when reassignment is unnecessary, otherwise use let.",

  "prefer-const":
    "Change the variable declaration from let to const.",

  "parser-error":
    "Fix the reported syntax or parsing error before running further analysis.",
};

function getNormalizedRuleId(
  issue: EslintIssue,
): string {
  return issue.ruleId ?? "parser-error";
}

function getFindingCategory(
  ruleId: string,
): FindingCategory {
  switch (ruleId) {
    case "no-await-in-loop":
      return "performance";

    case "eqeqeq":
    case "no-unsafe-optional-chaining":
    case "@typescript-eslint/no-unused-expressions":
    case "@typescript-eslint/no-non-null-assertion":
    case "@typescript-eslint/no-unsafe-declaration-merging":
    case "parser-error":
      return "bug";

    case "no-var":
    case "prefer-const":
      return "style";

    case "no-debugger":
    case "@typescript-eslint/no-array-constructor":
    case "@typescript-eslint/no-wrapper-object-types":
    case "@typescript-eslint/prefer-as-const":
      return "best-practice";

    case "@typescript-eslint/no-unused-vars":
    case "@typescript-eslint/no-explicit-any":
    case "@typescript-eslint/no-empty-object-type":
      return "maintainability";

    default:
      return "maintainability";
  }
}

function getFindingSeverity(
  issue: EslintIssue,
  ruleId: string,
): FindingSeverity {
  if (issue.fatal || ruleId === "parser-error") {
    return "high";
  }

  switch (ruleId) {
    case "no-unsafe-optional-chaining":
    case "@typescript-eslint/no-unsafe-declaration-merging":
      return "high";

    case "eqeqeq":
    case "no-debugger":
    case "@typescript-eslint/no-unused-expressions":
    case "@typescript-eslint/no-non-null-assertion":
      return "medium";

    default:
      return issue.severity === "error"
        ? "medium"
        : "low";
  }
}

function getFindingConfidence(
  issue: EslintIssue,
  ruleId: string,
): number {
  if (issue.fatal || ruleId === "parser-error") {
    return 1;
  }

  if (RULE_TITLES[ruleId] !== undefined) {
    return 0.95;
  }

  return 0.9;
}

function humanizeRuleId(
  ruleId: string,
): string {
  const ruleName =
    ruleId.split("/").at(-1) ?? ruleId;

  const humanized = ruleName
    .split("-")
    .filter(Boolean)
    .map((word) => {
      return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");

  return humanized.length > 0
    ? humanized
    : "Static analysis finding";
}

function getFindingTitle(
  ruleId: string,
): string {
  return (
    RULE_TITLES[ruleId] ??
    humanizeRuleId(ruleId)
  ).slice(0, 200);
}

function getSuggestedFix(
  ruleId: string,
): string {
  return (
    SUGGESTED_FIXES[ruleId] ??
    "Review the reported issue and update the affected code according to the rule guidance."
  );
}

function getExplanation(
  issue: EslintIssue,
  ruleId: string,
): string {
  const ruleLabel =
    ruleId === "parser-error"
      ? "the source parser"
      : `ESLint rule "${ruleId}"`;

  return `${issue.message} This issue was detected by ${ruleLabel}.`;
}

function createFindingFingerprint(
  finding: ReviewFinding,
): string {
  const fingerprintPayload = JSON.stringify({
    source: finding.source,
    ruleId: finding.ruleId ?? null,
    category: finding.category,
    fileName: finding.fileName,
    lineStart: finding.lineStart ?? null,
    lineEnd: finding.lineEnd ?? null,
    explanation: finding.explanation
      .trim()
      .replace(/\s+/g, " "),
  });

  return createHash("sha256")
    .update(fingerprintPayload, "utf8")
    .digest("hex");
}

function normalizeSingleIssue(
  fileName: string,
  issue: EslintIssue,
): NormalizedStaticFinding {
  const ruleId = getNormalizedRuleId(issue);

  const normalizedEndLine =
    issue.endLine !== undefined
      ? Math.max(issue.line, issue.endLine)
      : undefined;

  const finding = reviewFindingSchema.parse({
    source: "static",
    ruleId,
    title: getFindingTitle(ruleId),
    category: getFindingCategory(ruleId),
    severity: getFindingSeverity(
      issue,
      ruleId,
    ),
    confidence: getFindingConfidence(
      issue,
      ruleId,
    ),
    fileName,
    lineStart: Math.max(1, issue.line),

    ...(normalizedEndLine !== undefined
      ? {
          lineEnd: normalizedEndLine,
        }
      : {}),

    explanation: getExplanation(
      issue,
      ruleId,
    ),

    suggestedFix:
      getSuggestedFix(ruleId),
  });

  return {
    finding,
    fingerprint:
      createFindingFingerprint(finding),
  };
}

export function normalizeEslintFindings(
  input: NormalizeEslintFindingsInput,
): NormalizedStaticFinding[] {
  const fileName = input.fileName.trim();

  if (fileName.length === 0) {
    throw new Error(
      "A file name is required to normalize ESLint findings",
    );
  }

  const normalizedFindings =
    input.issues.map((issue) => {
      return normalizeSingleIssue(
        fileName,
        issue,
      );
    });

  if (
    normalizedFindings.length !==
    input.issues.length
  ) {
    throw new Error(
      "Not all ESLint issues were normalized",
    );
  }

  return normalizedFindings;
}