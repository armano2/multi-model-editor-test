import type { ParseSettings } from '@typescript-eslint/typescript-estree/dist/parseSettings';
import type { TSESLint } from '@typescript-eslint/utils';

export const defaultParseSettings: ParseSettings = {
  code: '',
  comment: true,
  comments: [],
  createDefaultProgram: false,
  debugLevel: new Set(),
  errorOnUnknownASTType: false,
  extraFileExtensions: [],
  filePath: '',
  jsx: true,
  loc: true,
  // eslint-disable-next-line no-console
  log: console.log,
  preserveNodeMaps: true,
  projects: [],
  range: true,
  tokens: [],
  tsconfigRootDir: '/',
  tsconfigMatchCache: new Map(),
  errorOnTypeScriptSyntacticAndSemanticIssues: false,
  EXPERIMENTAL_useSourceOfProjectReferenceRedirect: false,
  singleRun: false,
  programs: null,
  moduleResolver: '',
};

export const PARSER_NAME = '@typescript-eslint/parser';

export const defaultEslintConfig: TSESLint.Linter.Config = {
  parser: PARSER_NAME,
  parserOptions: {
    ecmaFeatures: {
      jsx: false,
      globalReturn: false,
    },
    ecmaVersion: 'latest',
    project: ['./tsconfig.json'],
    sourceType: 'module',
  },
  rules: {},
};
