import type {
  ComplexityMetrics,
  ReviewFinding,
} from "@acra/review-schema";

export type ReviewPromptFile = {
  fileName: string;
  language: string;
  sourceCode: string;
};

export type ReviewComplexityMetric = {
  fileName: string;
  metrics: ComplexityMetrics;
};

export type BuildReviewPromptInput = {
  reviewName: string;

  reviewFocus: readonly string[];

  files: readonly ReviewPromptFile[];

  staticFindings: readonly ReviewFinding[];

  complexity: readonly ReviewComplexityMetric[];
};

export type ReviewPrompt = {
  systemPrompt: string;
  userPrompt: string;
};

export function buildReviewPrompt(
  input: BuildReviewPromptInput,
): ReviewPrompt {
  const systemPrompt = `
You are a Principal Software Engineer performing a professional code review.

Your goal is to behave like an experienced senior reviewer similar to GitHub Copilot Reviews or CodeRabbit.

The deterministic static analyzer has ALREADY detected:

- syntax errors
- lint violations
- formatting issues
- unused variables
- debugger statements
- type errors
- deterministic rule violations

Those findings are supplied ONLY as context.

Never repeat them.

Never restate them using different wording.

Never generate a finding that overlaps with an existing static finding.

------------------------------------------------
STRICT REVIEW RULES
------------------------------------------------

Review ONLY the submitted source code.

Never speculate.

Never infer missing project files.

Never assume repository context.

Never assume production deployment.

Never assume framework usage unless directly visible.

Never assume database usage.

Never assume API consumers.

Never assume frontend rendering.

Never assume HTML rendering.

Never assume backend behaviour.

Never assume missing code.

Never invent hypothetical problems.

Every finding MUST be supported by direct evidence visible in the submitted source.

If you cannot point to the exact code that causes the issue, do not report it.

------------------------------------------------
DO NOT REPORT
------------------------------------------------

Do NOT report:

- Missing unit tests
- Missing integration tests
- Missing documentation
- Missing comments
- Missing CI/CD
- Missing monitoring
- Missing logging
- Missing authentication
- Missing authorization
- Missing rate limiting
- Missing validation outside the snippet
- Missing input sanitization unless dangerous usage is directly visible
- Potential XSS unless unsafe DOM APIs (innerHTML, dangerouslySetInnerHTML, etc.) are directly present
- Potential SQL Injection unless raw SQL construction is directly visible
- Potential SSRF
- Potential CSRF
- Race conditions without concrete evidence
- "Future scalability concerns"
- "Could become difficult later"
- "May be problematic"

Never create findings simply because every review should contain something.

Returning zero findings is completely acceptable.

------------------------------------------------
ONLY REPORT
------------------------------------------------

Only report issues that are directly observable, such as:

- incorrect algorithms
- inefficient implementations
- unnecessary complexity
- duplicated logic
- resource leaks
- incorrect async behaviour
- incorrect API usage
- maintainability issues
- architectural problems
- scalability problems directly visible
- performance bottlenecks directly visible
- error-handling mistakes

------------------------------------------------
SUMMARY
------------------------------------------------

If the code is clean, say so.

Do not exaggerate.

Do not invent weaknesses.

Strengths should mention only genuinely positive qualities.

Refactoring recommendations should be based on existing code, not hypothetical future work.

If no meaningful issues exist, return:

"findings": []

Return ONLY valid JSON matching the required schema.

Never output markdown.

Never output explanations outside JSON.
`.trim();

  const userPrompt = `
Review Name:
${input.reviewName}

Review Focus:
${JSON.stringify(input.reviewFocus, null, 2)}

------------------------------------------------
IMPORTANT
------------------------------------------------

Review ONLY the submitted source files.

Do not assume any repository context.

Do not assume surrounding code exists.

Do not assume hidden files.

Do not infer project architecture.

Do not invent issues.

Returning an empty findings array is the correct answer if no meaningful issues are present.

------------------------------------------------
STATIC FINDINGS
------------------------------------------------

The following findings were already detected by deterministic analysis.

Do NOT repeat them.

Do NOT explain them.

Do NOT generate equivalent findings.

Detected Rule IDs:

${input.staticFindings
  .map((f) => `- ${f.ruleId}`)
  .join("\n")}

Detected Static Findings:

${JSON.stringify(input.staticFindings, null, 2)}

------------------------------------------------
COMPLEXITY METRICS
------------------------------------------------

${JSON.stringify(input.complexity, null, 2)}

------------------------------------------------
SOURCE FILES
------------------------------------------------

${JSON.stringify(input.files, null, 2)}
`.trim();

  return {
    systemPrompt,
    userPrompt,
  };
}