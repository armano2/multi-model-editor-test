export interface EditorFile {
  name: string;
  language: "json" | "typescript";
  value: string;
}

export const baseFiles: Record<string, EditorFile> = {
  "script.ts": {
    name: "script.ts",
    language: "typescript",
    value: `const x = Promise.resolve()`,
  },
  "tsconfig.json": {
    name: "tsconfig.json",
    language: "json",
    value: `{}`,
  },
  ".eslintrc": {
    name: ".eslintrc",
    language: "json",
    value: `{}`,
  },
};

export const tsVersions: string[] = [
  "next",
  "4.9.5",
  "4.8.4",
  "4.7.4",
  "4.6.4",
  "4.5.5",
  "4.4.4",
  "4.3.5",
  "4.2.3",
  "4.1.5",
];
