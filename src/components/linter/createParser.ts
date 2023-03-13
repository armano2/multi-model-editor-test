import type { VirtualTypeScriptEnvironment } from '@typescript/vfs';
import { createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import type { ParserOptions } from '@typescript-eslint/types';
import type { ParseSettings } from '@typescript-eslint/typescript-estree/dist/parseSettings';
import type { TSESLint } from '@typescript-eslint/utils';
import type * as ts from 'typescript';

import type { EslintUtilsModule } from '../importer';
import type { PlaygroundSystem } from '../playground/types';
import { defaultParseSettings } from './config';
import type { UpdateModel } from './types';

export function createParser(
  system: PlaygroundSystem,
  compilerOptions: ts.CompilerOptions,
  onUpdate: (model: UpdateModel) => void,
  utils: EslintUtilsModule
): TSESLint.Linter.ParserModule & {
  updateConfig: (compilerOptions: ts.CompilerOptions) => void;
} {
  const registeredFiles = new Set<string>();

  const createEnv = (
    compilerOptions: ts.CompilerOptions
  ): VirtualTypeScriptEnvironment => {
    return createVirtualTypeScriptEnvironment(
      system,
      Array.from(registeredFiles),
      window.ts,
      compilerOptions
    );
  };

  let compilerHost = createEnv(compilerOptions);

  return {
    updateConfig(compilerOptions): void {
      compilerHost = createEnv(compilerOptions);
    },
    parseForESLint: (
      text: string,
      options: ParserOptions = {}
    ): TSESLint.Linter.ESLintParseResult => {
      const filePath = options.filePath ?? '/file.ts';

      // if text is empty use empty line to avoid error
      const code = text || '\n';

      if (registeredFiles.has(filePath)) {
        compilerHost.updateFile(filePath, code);
      } else {
        registeredFiles.add(filePath);
        compilerHost.createFile(filePath, code);
      }

      const parseSettings: ParseSettings = {
        ...defaultParseSettings,
        code: code,
        filePath: filePath,
      };

      const program = compilerHost.languageService.getProgram();
      if (!program) {
        throw new Error('Failed to get program');
      }

      const tsAst = program.getSourceFile(filePath)!;

      const converted = utils.astConverter(tsAst, parseSettings, true);

      const scopeManager = utils.analyze(converted.estree, {
        ecmaVersion:
          options.ecmaVersion === 'latest' ? 1e8 : options.ecmaVersion,
        globalReturn: options.ecmaFeatures?.globalReturn ?? false,
        sourceType: options.sourceType ?? 'module',
      });

      onUpdate({
        storedAST: converted.estree,
        storedTsAST: tsAst,
        storedScope: scopeManager,
        program: program,
      });

      return {
        ast: converted.estree,
        services: {
          hasFullTypeInformation: true,
          program,
          esTreeNodeToTSNodeMap: converted.astMaps.esTreeNodeToTSNodeMap,
          tsNodeToESTreeNodeMap: converted.astMaps.tsNodeToESTreeNodeMap,
        },
        scopeManager,
        visitorKeys: utils.visitorKeys,
      };
    },
  };
}
