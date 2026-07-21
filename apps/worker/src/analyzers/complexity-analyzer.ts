import {
  complexityMetricsSchema,
  type ComplexityMetrics,
} from "@acra/review-schema";
import * as ts from "typescript";
import { z } from "zod";

const complexitySupportedLanguageSchema = z.enum([
  "javascript",
  "jsx",
  "typescript",
  "tsx",
]);

export type ComplexitySupportedLanguage = z.infer<
  typeof complexitySupportedLanguageSchema
>;

const complexityAnalysisInputSchema = z.object({
  fileName: z.string().trim().min(1).max(255),

  language: complexitySupportedLanguageSchema,

  sourceText: z.string().min(1),
});

export type ComplexityAnalysisInput = z.input<
  typeof complexityAnalysisInputSchema
>;

type SourceLineMetrics = {
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
};

type AstMetrics = {
  functionCount: number;
  classCount: number;
  importCount: number;
  decisionPointCount: number;
  maximumNestingDepth: number;
  functionLengths: number[];
};

const COMPLEXITY_ANALYSIS_TIMEOUT_MS = 30_000;

const SCRIPT_KIND_BY_LANGUAGE: Record<
  ComplexitySupportedLanguage,
  ts.ScriptKind
> = {
  javascript: ts.ScriptKind.JS,
  jsx: ts.ScriptKind.JSX,
  typescript: ts.ScriptKind.TS,
  tsx: ts.ScriptKind.TSX,
};

function roundToTwoDecimals(
  value: number,
): number {
  return Math.round(value * 100) / 100;
}

function getLineRange(
  sourceFile: ts.SourceFile,
  startPosition: number,
  endPositionExclusive: number,
): {
  startLine: number;
  endLine: number;
} {
  const normalizedEndPosition = Math.max(
    startPosition,
    endPositionExclusive - 1,
  );

  const start =
    sourceFile.getLineAndCharacterOfPosition(
      startPosition,
    );

  const end =
    sourceFile.getLineAndCharacterOfPosition(
      normalizedEndPosition,
    );

  return {
    startLine: start.line,
    endLine: end.line,
  };
}

function addLineRange(
  targetLines: Set<number>,
  startLine: number,
  endLine: number,
): void {
  for (
    let line = startLine;
    line <= endLine;
    line += 1
  ) {
    targetLines.add(line);
  }
}

function isCommentToken(
  token: ts.SyntaxKind,
): boolean {
  return (
    token ===
      ts.SyntaxKind.SingleLineCommentTrivia ||
    token ===
      ts.SyntaxKind.MultiLineCommentTrivia
  );
}

function isCodeToken(
  token: ts.SyntaxKind,
): boolean {
  return ![
    ts.SyntaxKind.EndOfFileToken,
    ts.SyntaxKind.WhitespaceTrivia,
    ts.SyntaxKind.NewLineTrivia,
    ts.SyntaxKind.SingleLineCommentTrivia,
    ts.SyntaxKind.MultiLineCommentTrivia,
    ts.SyntaxKind.ShebangTrivia,
    ts.SyntaxKind.ConflictMarkerTrivia,
  ].includes(token);
}

function collectSourceLineMetrics(
  sourceFile: ts.SourceFile,
  sourceText: string,
  language: ComplexitySupportedLanguage,
): SourceLineMetrics {
  const codeLines = new Set<number>();
  const commentLines = new Set<number>();

  const languageVariant =
    language === "jsx" ||
    language === "tsx"
      ? ts.LanguageVariant.JSX
      : ts.LanguageVariant.Standard;

  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    languageVariant,
    sourceText,
  );

  while (true) {
    const token = scanner.scan();

    if (
      token ===
      ts.SyntaxKind.EndOfFileToken
    ) {
      break;
    }

    const tokenStart =
      scanner.getTokenPos();

    const tokenEnd =
      scanner.getTextPos();

    const lineRange = getLineRange(
      sourceFile,
      tokenStart,
      tokenEnd,
    );

    if (isCommentToken(token)) {
      addLineRange(
        commentLines,
        lineRange.startLine,
        lineRange.endLine,
      );

      continue;
    }

    if (isCodeToken(token)) {
      addLineRange(
        codeLines,
        lineRange.startLine,
        lineRange.endLine,
      );
    }
  }

  const physicalLines = sourceText.split(
    /\r\n|\r|\n/,
  );

  const blankLines = physicalLines.reduce(
    (count, line) => {
      return line.trim().length === 0
        ? count + 1
        : count;
    },
    0,
  );

  return {
    linesOfCode: codeLines.size,
    blankLines,
    commentLines: commentLines.size,
  };
}

function isFunctionNode(
  node: ts.Node,
): node is ts.FunctionLikeDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

function isClassNode(
  node: ts.Node,
): boolean {
  return (
    ts.isClassDeclaration(node) ||
    ts.isClassExpression(node)
  );
}

function isImportNode(
  node: ts.Node,
): boolean {
  return (
    ts.isImportDeclaration(node) ||
    ts.isImportEqualsDeclaration(node)
  );
}

function isLogicalDecisionOperator(
  operator: ts.SyntaxKind,
): boolean {
  return (
    operator ===
      ts.SyntaxKind.AmpersandAmpersandToken ||
    operator ===
      ts.SyntaxKind.BarBarToken ||
    operator ===
      ts.SyntaxKind.QuestionQuestionToken
  );
}

function isDecisionPoint(
  node: ts.Node,
): boolean {
  if (
    ts.isIfStatement(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isWhileStatement(node) ||
    ts.isDoStatement(node) ||
    ts.isCaseClause(node) ||
    ts.isCatchClause(node) ||
    ts.isConditionalExpression(node)
  ) {
    return true;
  }

  return (
    ts.isBinaryExpression(node) &&
    isLogicalDecisionOperator(
      node.operatorToken.kind,
    )
  );
}

function increasesNestingDepth(
  node: ts.Node,
): boolean {
  return (
    ts.isIfStatement(node) ||
    ts.isForStatement(node) ||
    ts.isForInStatement(node) ||
    ts.isForOfStatement(node) ||
    ts.isWhileStatement(node) ||
    ts.isDoStatement(node) ||
    ts.isSwitchStatement(node) ||
    ts.isTryStatement(node) ||
    ts.isCatchClause(node) ||
    ts.isConditionalExpression(node)
  );
}

function calculateNodeLength(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): number {
  const startPosition = node.getStart(
    sourceFile,
    false,
  );

  const endPosition = node.getEnd();

  const lineRange = getLineRange(
    sourceFile,
    startPosition,
    endPosition,
  );

  return (
    lineRange.endLine -
    lineRange.startLine +
    1
  );
}

function collectAstMetrics(
  sourceFile: ts.SourceFile,
): AstMetrics {
  const metrics: AstMetrics = {
    functionCount: 0,
    classCount: 0,
    importCount: 0,
    decisionPointCount: 0,
    maximumNestingDepth: 0,
    functionLengths: [],
  };

  const deadline =
    performance.now() +
    COMPLEXITY_ANALYSIS_TIMEOUT_MS;

  let visitedNodeCount = 0;

  const visit = (
    node: ts.Node,
    currentNestingDepth: number,
  ): void => {
    visitedNodeCount += 1;

    if (
      visitedNodeCount % 250 === 0 &&
      performance.now() > deadline
    ) {
      throw new Error(
        `Complexity analysis exceeded ${COMPLEXITY_ANALYSIS_TIMEOUT_MS}ms`,
      );
    }

    if (isFunctionNode(node)) {
      metrics.functionCount += 1;

      metrics.functionLengths.push(
        calculateNodeLength(
          sourceFile,
          node,
        ),
      );
    }

    if (isClassNode(node)) {
      metrics.classCount += 1;
    }

    if (isImportNode(node)) {
      metrics.importCount += 1;
    }

    if (isDecisionPoint(node)) {
      metrics.decisionPointCount += 1;
    }

    const nextNestingDepth =
      increasesNestingDepth(node)
        ? currentNestingDepth + 1
        : currentNestingDepth;

    metrics.maximumNestingDepth =
      Math.max(
        metrics.maximumNestingDepth,
        nextNestingDepth,
      );

    ts.forEachChild(node, (child) => {
      visit(
        child,
        nextNestingDepth,
      );
    });
  };

  visit(sourceFile, 0);

  return metrics;
}

function calculateMaintainabilityScore(
  input: {
    linesOfCode: number;
    cyclomaticComplexity: number;
    functionCount: number;
    maximumNestingDepth: number;
    averageFunctionLength: number;
    maximumFunctionLength: number;
  },
): number {
  const baselineComplexity = Math.max(
    1,
    input.functionCount,
  );

  const complexityPenalty = Math.min(
    30,
    Math.max(
      0,
      input.cyclomaticComplexity -
        baselineComplexity,
    ) * 2,
  );

  const nestingPenalty = Math.min(
    20,
    Math.max(
      0,
      input.maximumNestingDepth - 3,
    ) * 5,
  );

  const averageFunctionPenalty = Math.min(
    15,
    Math.max(
      0,
      input.averageFunctionLength - 20,
    ) * 0.4,
  );

  const maximumFunctionPenalty = Math.min(
    15,
    Math.max(
      0,
      input.maximumFunctionLength - 60,
    ) * 0.2,
  );

  const fileSizePenalty = Math.min(
    20,
    Math.max(
      0,
      input.linesOfCode - 300,
    ) * 0.05,
  );

  return roundToTwoDecimals(
    Math.max(
      0,
      100 -
        complexityPenalty -
        nestingPenalty -
        averageFunctionPenalty -
        maximumFunctionPenalty -
        fileSizePenalty,
    ),
  );
}

export function analyzeSourceComplexity(
  input: ComplexityAnalysisInput,
): ComplexityMetrics {
  const validatedInput =
    complexityAnalysisInputSchema.parse(
      input,
    );

  const scriptKind =
    SCRIPT_KIND_BY_LANGUAGE[
      validatedInput.language
    ];

  const sourceFile =
    ts.createSourceFile(
      validatedInput.fileName,
      validatedInput.sourceText,
      ts.ScriptTarget.Latest,
      true,
      scriptKind,
    );

  const sourceLineMetrics =
    collectSourceLineMetrics(
      sourceFile,
      validatedInput.sourceText,
      validatedInput.language,
    );

  const astMetrics =
    collectAstMetrics(sourceFile);

  const totalFunctionLength =
    astMetrics.functionLengths.reduce(
      (total, length) =>
        total + length,
      0,
    );

  const averageFunctionLength =
    astMetrics.functionCount > 0
      ? roundToTwoDecimals(
          totalFunctionLength /
            astMetrics.functionCount,
        )
      : 0;

  const maximumFunctionLength =
    astMetrics.functionLengths.length > 0
      ? Math.max(
          ...astMetrics.functionLengths,
        )
      : 0;

  const cyclomaticComplexity =
    Math.max(
      1,
      astMetrics.functionCount,
    ) +
    astMetrics.decisionPointCount;

  const maintainabilityScore =
    calculateMaintainabilityScore({
      linesOfCode:
        sourceLineMetrics.linesOfCode,

      cyclomaticComplexity,

      functionCount:
        astMetrics.functionCount,

      maximumNestingDepth:
        astMetrics.maximumNestingDepth,

      averageFunctionLength,

      maximumFunctionLength,
    });

  return complexityMetricsSchema.parse({
    linesOfCode:
      sourceLineMetrics.linesOfCode,

    blankLines:
      sourceLineMetrics.blankLines,

    commentLines:
      sourceLineMetrics.commentLines,

    functionCount:
      astMetrics.functionCount,

    classCount:
      astMetrics.classCount,

    importCount:
      astMetrics.importCount,

    cyclomaticComplexity,

    maximumNestingDepth:
      astMetrics.maximumNestingDepth,

    averageFunctionLength,

    maximumFunctionLength,

    maintainabilityScore,
  });
}