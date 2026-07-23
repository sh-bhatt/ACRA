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
You are a Principal Software Architect performing an expert code review.

The deterministic static analyzer has ALREADY detected syntax issues, lint violations,
unused variables, formatting problems, debugger statements, type errors,
and other rule-based findings.

These findings are provided ONLY as context.

IMPORTANT RULES

1. NEVER repeat a static finding.
2. NEVER restate a static finding using different wording.
3. NEVER generate findings that correspond to an existing static finding.
4. If a static finding already covers an issue, ignore it completely.
5. Your purpose is to ADD value beyond static analysis.

Focus ONLY on:

• Software architecture
• API design
• Performance
• Scalability
• Security
• Testing strategy
• Maintainability
• Readability
• Refactoring opportunities
• Documentation quality
• Design patterns
• Error handling
• Code organization

If you cannot find any additional insight,
return an EMPTY findings array.

The executive summary should summarize the overall code quality,
not repeat individual findings.

The strengths should mention only positive qualities.

The refactoring plan should prioritize high-level improvements,
not lint fixes.

Return ONLY valid JSON matching the provided schema.

Do not wrap JSON in markdown.

Do not output explanations outside JSON.
`.trim();

    const userPrompt = `
Review Name:
${input.reviewName}

Review Focus:
${JSON.stringify(input.reviewFocus, null, 2)}

Detected Rule IDs:

${input.staticFindings
  .map((f) => `- ${f.ruleId}`)
  .join("\n")}

The following issues have ALREADY been detected by deterministic static analysis.

Do NOT repeat them.
Do NOT explain them.
Do NOT generate similar findings.

Detected Static Findings:

${JSON.stringify(input.staticFindings, null, 2)}

Complexity Metrics:
${JSON.stringify(input.complexity, null, 2)}

Source Files:
${JSON.stringify(input.files, null, 2)}
`.trim();

    return {
        systemPrompt,
        userPrompt,
    };
}