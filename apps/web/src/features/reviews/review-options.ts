export const PASTE_LANGUAGE_VALUES = [
  "javascript",
  "jsx",
  "typescript",
  "tsx",
] as const;

export type PasteLanguage =
  (typeof PASTE_LANGUAGE_VALUES)[number];

export const PASTE_LANGUAGE_OPTIONS: ReadonlyArray<{
  value: PasteLanguage;
  label: string;
  extension: string;
}> = [
  {
    value: "javascript",
    label: "JavaScript",
    extension: "js",
  },
  {
    value: "jsx",
    label: "JavaScript JSX",
    extension: "jsx",
  },
  {
    value: "typescript",
    label: "TypeScript",
    extension: "ts",
  },
  {
    value: "tsx",
    label: "TypeScript TSX",
    extension: "tsx",
  },
];

export function getLanguageExtension(
  language: PasteLanguage,
): string {
  return (
    PASTE_LANGUAGE_OPTIONS.find(
      (option) => option.value === language,
    )?.extension ?? "txt"
  );
}