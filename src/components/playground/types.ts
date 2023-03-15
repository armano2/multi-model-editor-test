import type { TSESLint } from '@typescript-eslint/utils';
import type * as ts from 'typescript';

import type { detailTabs, fileTypes } from './config';

export interface ErrorItem {
  message: string;
  location: string;
  severity: number;
  suggestions: { message: string; fix(): void }[];
  fixer?: { message: string; fix(): void };
}

export interface ErrorGroup {
  group: string;
  uri?: string;
  items: ErrorItem[];
}

export type EslintRC = Record<string, unknown> & {
  rules: TSESLint.Linter.RulesRecord;
  parserOptions?: {
    sourceType?: TSESLint.SourceType;
  };
};

export type TSConfig = Record<string, unknown> & {
  compilerOptions: Record<string, unknown>;
};

export interface ConfigModel {
  sourceType?: TSESLint.SourceType;
  eslintrc: string;
  tsconfig: string;
  code: string;
  ts: string;
  tse: string;
  showAST?: (typeof detailTabs)[number]['value'];
  fileType: (typeof fileTypes)[number];
}

export type PlaygroundSystem = ts.System &
  Required<Pick<ts.System, 'watchFile' | 'watchDirectory' | 'deleteFile'>> & {
    removeFile: (fileName: string) => void;
  };
