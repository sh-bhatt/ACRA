import path from "node:path";

import js from "@eslint/js";
import { ESLint } from "eslint";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import { z } from "zod";

export const eslintSupportedLanguageSchema = z.enum([
  "javascript",
  "jsx",
  "typescript",
  "tsx",
]);

export type EslintSupportedLanguage = z.infer<
  typeof eslintSupportedLanguageSchema
>;

const eslintAnalysisInputSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  language: eslintSupportedLanguageSchema,
  sourceText: z.string().min(1),
});

export type EslintIssueSeverity =
  | "error"
  | "warning";

export type EslintIssue = {
  ruleId: string | null;
  severity: EslintIssueSeverity;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fatal: boolean;
  fixable: boolean;
  suggestionCount: number;
};

export type EslintAnalysisResult = {
  fileName: string;
  errorCount: number;
  warningCount: number;
  fatalErrorCount: number;
  issues: EslintIssue[];
};

const VIRTUAL_FILE_NAME_BY_LANGUAGE: Record<
  EslintSupportedLanguage,
  string
> = {
  javascript: "submitted-code.js",
  jsx: "submitted-code.jsx",
  typescript: "submitted-code.ts",
  tsx: "submitted-code.tsx",
};

const ESLINT_ANALYSIS_TIMEOUT_MS = 30_000;

const acraEslintConfig = defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },

        // Pasted code does not have a trusted user project.
        project: false,
      },
    },

    rules: {
      /*
       * Environment globals are unknown for pasted snippets.
       * Avoid false positives for browser/Node globals.
       */
      "no-undef": "off",

      /*
       * Use the TypeScript-aware extension rules for all four
       * supported JavaScript/TypeScript input variants.
       */
      "no-unused-vars": "off",
      "no-unused-expressions": "off",
      "no-array-constructor": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-unused-expressions":
        "error",

      "@typescript-eslint/no-array-constructor":
        "warn",

      "@typescript-eslint/no-explicit-any": "warn",

      "@typescript-eslint/no-non-null-assertion":
        "warn",

      "@typescript-eslint/no-empty-object-type":
        "warn",

      "@typescript-eslint/no-unsafe-declaration-merging":
        "error",

      "@typescript-eslint/no-wrapper-object-types":
        "error",

      "@typescript-eslint/prefer-as-const": "warn",

      /*
       * ACRA-owned additional checks.
       */
      eqeqeq: [
        "warn",
        "always",
        {
          null: "ignore",
        },
      ],

      "no-await-in-loop": "warn",
      "no-debugger": "error",
      "no-unsafe-optional-chaining": "error",
      "no-var": "warn",
      "prefer-const": "warn",
    },
  },
);

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: acraEslintConfig,

  allowInlineConfig: false,
  fix: false,
  cache: false,
  ignore: false,
  warnIgnored: false,
});

async function runWithTimeout<T>(
  operation: Promise<T>,
  timeoutMilliseconds: number,
): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>(
    (_, reject) => {
      timeout = setTimeout(() => {
        reject(
          new Error(
            `ESLint analysis exceeded ${timeoutMilliseconds}ms`,
          ),
        );
      }, timeoutMilliseconds);

      timeout.unref();
    },
  );

  try {
    return await Promise.race([
      operation,
      timeoutPromise,
    ]);
  } finally {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
  }
}

function mapIssue(
  message: ESLint.LintResult["messages"][number],
): EslintIssue {
  return {
    ruleId: message.ruleId,

    severity:
      message.severity === 2
        ? "error"
        : "warning",

    message: message.message,
    line: message.line,
    column: message.column,

    ...(message.endLine !== undefined
      ? {
          endLine: message.endLine,
        }
      : {}),

    ...(message.endColumn !== undefined
      ? {
          endColumn: message.endColumn,
        }
      : {}),

    fatal: message.fatal === true,
    fixable: message.fix !== undefined,

    suggestionCount:
      message.suggestions?.length ?? 0,
  };
}

export async function analyzeSourceWithEslint(
  input: z.input<
    typeof eslintAnalysisInputSchema
  >,
): Promise<EslintAnalysisResult> {
  const validatedInput =
    eslintAnalysisInputSchema.parse(input);

  const virtualFilePath = path.resolve(
    process.cwd(),
    ".acra-virtual",
    VIRTUAL_FILE_NAME_BY_LANGUAGE[
      validatedInput.language
    ],
  );

  const results = await runWithTimeout(
    eslint.lintText(
      validatedInput.sourceText,
      {
        filePath: virtualFilePath,
        warnIgnored: false,
      },
    ),
    ESLINT_ANALYSIS_TIMEOUT_MS,
  );

  const result = results[0];

  if (!result) {
    throw new Error(
      `ESLint returned no result for ${validatedInput.fileName}`,
    );
  }

  return {
    fileName: validatedInput.fileName,
    errorCount: result.errorCount,
    warningCount: result.warningCount,
    fatalErrorCount: result.fatalErrorCount,
    issues: result.messages.map(mapIssue),
  };
}