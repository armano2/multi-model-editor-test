import type { TSESLint } from '@typescript-eslint/utils';
import type * as Monaco from 'monaco-editor';
import type * as ts from 'typescript';

import { parseESLintRC, parseTSConfig } from '../config/utils';
import type { EslintUtilsModule } from '../importer';
import type { PlaygroundSystem } from '../playground/types';
import { debounce } from '../util/debounce';
import { defaultEslintConfig, PARSER_NAME } from './config';
import { createParser } from './createParser';
import type { Disposable, UpdateModel } from './types';
import {
  createCompilerOptions,
  isCodeFile,
  isEslintrcFile,
  isTSConfigFile,
} from './utils';

export type RulesMap = Map<
  string,
  { name: string; description?: string; url?: string }
>;

export type LinterOnLint = (
  fileName: string,
  messages: TSESLint.Linter.LintMessage[],
  rules: RulesMap
) => void;

export interface LinterResult {
  rules: RulesMap;
  triggerFix: (filename: string) => TSESLint.Linter.FixReport | undefined;
  triggerLint: (filename: string) => void;
  lintAllFiles: () => void;
  onLint: (cb: LinterOnLint) => Disposable;
}

export function createLinter(
  monaco: typeof Monaco,
  onUpdate: (model: UpdateModel) => void,
  system: PlaygroundSystem,
  utils: EslintUtilsModule
): LinterResult {
  const rules: LinterResult['rules'] = new Map();
  let compilerOptions: ts.CompilerOptions = {};
  const eslintConfig = { ...defaultEslintConfig };

  const onLintEvents: Set<LinterOnLint> = new Set();

  const linter = new utils.Linter();

  for (const name in utils.eslintRules) {
    linter.defineRule(name, utils.eslintRules[name]);
  }
  for (const name in utils.rules) {
    linter.defineRule(`@typescript-eslint/${name}`, utils.rules[name]);
  }

  const parser = createParser(
    system,
    compilerOptions,
    (model): void => onUpdate(model),
    utils
  );

  linter.defineParser(PARSER_NAME, parser);

  linter.getRules().forEach((item, name) => {
    rules.set(name, {
      name: name,
      description: item.meta?.docs?.description,
      url: item.meta?.docs?.url,
    });
  });

  const triggerLint = (filename: string): void => {
    const code = system.readFile(filename) ?? '\n';
    if (code != null) {
      const messages = linter.verify(code, eslintConfig, filename);
      onLintEvents.forEach((cb) => cb(filename, messages, rules));
    }
  };

  const triggerFix = (
    filename: string
  ): TSESLint.Linter.FixReport | undefined => {
    const code = system.readFile(filename);
    if (code) {
      return linter.verifyAndFix(code, eslintConfig, {
        filename: filename,
        fix: true,
      });
    }
    return undefined;
  };

  const applyEslintConfig = (fileName: string): void => {
    try {
      const file = system.readFile(fileName) ?? '{}';
      const parsed = parseESLintRC(file);
      eslintConfig.rules = parsed.rules;
      eslintConfig.parserOptions ??= {};
      eslintConfig.parserOptions.sourceType =
        parsed.parserOptions?.sourceType ?? 'module';
      // eslint-disable-next-line no-console
      console.log('[Editor] Updating', fileName, eslintConfig);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const applyTSConfig = (fileName: string): void => {
    try {
      const file = system.readFile(fileName) ?? '{}';
      const parsed = parseTSConfig(file).compilerOptions;
      const options = createCompilerOptions(parsed);

      compilerOptions = options.options;

      // eslint-disable-next-line no-console
      console.log('[Editor] Updating', fileName, compilerOptions);

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
        // @ts-expect-error monaco is using different type for CompilerOptions
        compilerOptions
      );
      parser.updateConfig(compilerOptions);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const lintAllFiles = (): void => {
    const files = system.readDirectory('/');
    for (const fileName of files) {
      if (isCodeFile(fileName)) {
        triggerLint(fileName);
      }
    }
  };

  // Trigger linting 500ms after file changed
  system.watchDirectory(
    '/',
    debounce((fileName) => {
      if (isCodeFile(fileName)) {
        triggerLint(fileName);
      } else if (isEslintrcFile(fileName)) {
        applyEslintConfig(fileName);
        lintAllFiles();
      } else if (isTSConfigFile(fileName)) {
        applyTSConfig(fileName);
        lintAllFiles();
      }
    }, 500)
  );

  applyEslintConfig('/.eslintrc');
  applyTSConfig('/tsconfig.json');

  return {
    rules,
    lintAllFiles,
    triggerFix,
    triggerLint,
    onLint: (cb): Disposable => {
      onLintEvents.add(cb);

      return {
        dispose: (): void => {
          onLintEvents.delete(cb);
        },
      };
    },
  };
}
