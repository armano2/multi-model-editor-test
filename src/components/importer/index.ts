import type { configs, rules } from '@typescript-eslint/eslint-plugin';
import type { analyze } from '@typescript-eslint/scope-manager';
import type { astConverter } from '@typescript-eslint/typescript-estree/dist/ast-converter';
import type { getScriptKind } from '@typescript-eslint/typescript-estree/dist/create-program/getScriptKind';
import type { TSESLint } from '@typescript-eslint/utils';
import type esquery from 'esquery';

import { Importer } from './importer';
import { moduleOverrides } from './moduleOverrides';

type ImportedTypes = [
  { analyze: typeof analyze },
  { visitorKeys: TSESLint.SourceCode.VisitorKeys },
  { astConverter: typeof astConverter },
  typeof getScriptKind,
  { rules: typeof rules; configs: typeof configs },
  { Linter: typeof TSESLint.Linter; rules: typeof rules },
  { default: typeof esquery }
];

export interface EslintUtilsModule {
  analyze: typeof analyze;
  visitorKeys: TSESLint.SourceCode.VisitorKeys;
  astConverter: typeof astConverter;
  // getScriptKind: typeof getScriptKind;
  rules: typeof rules;
  Linter: typeof TSESLint.Linter;
  eslintRules: typeof rules;
}

export async function importEslintUtils(
  tsEslintVersion: string
): Promise<EslintUtilsModule> {
  const importer = new Importer();
  importer.registerModuleOverrides(moduleOverrides);

  const result = await importer.importFiles<ImportedTypes>([
    `/npm/@typescript-eslint/scope-manager@${tsEslintVersion}`,
    `/npm/@typescript-eslint/visitor-keys@${tsEslintVersion}/dist/visitor-keys`,
    `/npm/@typescript-eslint/typescript-estree@${tsEslintVersion}/dist/ast-converter.js`,
    `/npm/@typescript-eslint/typescript-estree@${tsEslintVersion}/dist/create-program/getScriptKind`,
    `/npm/@typescript-eslint/eslint-plugin@${tsEslintVersion}`,
    '/npm/eslint@8.35.0',
    '/npm/esquery@1.5.0',
  ]);

  window.esquery = result[6].default;

  return {
    analyze: result[0].analyze,
    visitorKeys: result[1].visitorKeys,
    astConverter: result[2].astConverter,
    // getScriptKind: result[3],
    rules: result[4].rules,
    Linter: result[5].Linter,
    eslintRules: result[5].rules,
  };
}
