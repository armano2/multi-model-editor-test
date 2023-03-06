export interface EditorFile {
  name: string;
  language: "json" | "typescript";
  value: string;
}

export const baseFiles: Record<string, EditorFile> = {
  "script.ts": {
    name: "script.ts",
    language: "typescript",
    value: `const x = Promise.resolve()`
  },
  "tsconfig.json": {
    name: "tsconfig.json",
    language: "json",
    value: `{ "test": 2 }`
  },
  ".eslintrc": {
    name: ".eslintrc",
    language: "json",
    value: `{ "test": 2 }`
  }
};

export const tsVersions: string[] = [
  "4.9.5",
  "4.8.4",
  "4.7.4",
  "4.6.4",
  "4.5.5",
  "4.4.4",
  "4.3.5",
  "4.2.3",
  "4.1.5",
  "4.0.5",
  "3.9.7",
  "3.8.3",
  "3.7.5",
  "3.6.3",
  "3.5.1",
  "3.3.3"
];
