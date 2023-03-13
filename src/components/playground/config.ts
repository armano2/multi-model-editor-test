import type * as Monaco from 'monaco-editor';

import { toJson } from '../config/utils';
import versions from './packageVersions.json';
import type { ConfigModel } from './types';

export const defaultConfig: ConfigModel = {
  ts: '4.9.5',
  tse: '5.52.0',
  sourceType: 'module',
  fileType: 'ts',
  showAST: false,
  tsconfig: toJson({
    compilerOptions: {
      strictNullChecks: true,
    },
    parserOptions: {
      sourceType: 'module',
    },
  }),
  eslintrc: toJson({
    rules: {},
  }),
  code: `const x = Promise.resolve();\ntype y = Array<string>\n`,
};

export const tsVersions: string[] = ['next', ...versions.typescript];

export const esTsVersions: string[] = [...versions.eslintPlugin];

export const detailTabs: {
  value: Exclude<ConfigModel['showAST'], undefined>;
  label: string;
}[] = [
  { value: false, label: 'Errors' },
  { value: 'es', label: 'ESTree' },
  { value: 'ts', label: 'TypeScript' },
  { value: 'scope', label: 'Scope' },
  { value: 'types', label: 'Types' },
];

export const defaultEditorOptions: Monaco.editor.IStandaloneEditorConstructionOptions =
  {
    minimap: {
      enabled: false,
    },
    fontSize: 13,
    wordWrap: 'off',
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true,
    wrappingIndent: 'same',
    hover: { above: false },
  };
