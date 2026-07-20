"use client";

import {
  javascript,
} from "@codemirror/lang-javascript";
import {
  oneDark,
} from "@codemirror/theme-one-dark";
import {
  EditorView,
} from "@codemirror/view";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import type {
  PasteLanguage,
} from "@/features/reviews/review-options";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[520px] items-center justify-center bg-[#0b100e] text-sm text-neutral-600">
        Loading editor...
      </div>
    ),
  },
);

type CodeEditorProps = {
  value: string;
  language: PasteLanguage;
  onChange: (value: string) => void;
};

export function CodeEditor({
  value,
  language,
  onChange,
}: CodeEditorProps) {
  const extensions = useMemo(() => {
    const jsx =
      language === "jsx" ||
      language === "tsx";

    const typescript =
      language === "typescript" ||
      language === "tsx";

    return [
      javascript({
        jsx,
        typescript,
      }),

      EditorView.lineWrapping,

      EditorView.theme({
        "&": {
          fontSize: "14px",
          backgroundColor: "#0b100e",
        },

        ".cm-content": {
          padding: "18px 0",
          fontFamily:
            "var(--font-geist-mono), ui-monospace, monospace",
        },

        ".cm-gutters": {
          backgroundColor: "#0b100e",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        },

        ".cm-activeLine": {
          backgroundColor:
            "rgba(255,255,255,0.025)",
        },

        ".cm-activeLineGutter": {
          backgroundColor:
            "rgba(255,255,255,0.025)",
        },
      }),
    ];
  }, [language]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b100e]">
      <CodeMirror
        value={value}
        height="520px"
        theme={oneDark}
        extensions={extensions}
        placeholder="Paste your code here..."
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          indentOnInput: true,
        }}
        onChange={onChange}
      />
    </div>
  );
}