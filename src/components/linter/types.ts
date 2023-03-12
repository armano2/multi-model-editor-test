import type { ScopeManager } from '@typescript-eslint/scope-manager';
import type { TSESTree } from '@typescript-eslint/utils';
import type * as ts from 'typescript';

export interface UpdateModel {
  storedAST?: TSESTree.Program;
  storedTsAST?: ts.SourceFile;
  storedScope?: ScopeManager;
}

export interface Disposable {
  dispose(): void;
}
