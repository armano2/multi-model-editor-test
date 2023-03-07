import './require';
import * as tsutils from 'tsutils';

window.require.absolute = 'https://cdn.jsdelivr.net/npm/';
window.require.mocks = {
  typescript: () => {
    // window.ts
    return {
      Extension: {},
      SyntaxKind: {},
    };
  },
  semver: () => {
    const satisfies = () => true;
    const major = window.require('semver/functions/major');
    return { satisfies, major };
  },
  'tsutils/util/util': () => {
    return tsutils;
  },
  '@typescript-eslint/utils@5.54.1/dist/ts-eslint': () => ({}),
  '@typescript-eslint/utils@5.54.1/dist/eslint-utils/rule-tester/RuleTester':
    () => ({}),
  '@typescript-eslint/utils@5.54.1/dist/ts-eslint-scope/analyze': () => {
    return window.require('eslint-scope/dist/eslint-scope.cjs');
  },
  path: () => ({}),
  fs: () => ({}),
};
window.require.registerMapping([
  {
    package: '@typescript-eslint/visitor-keys',
    version: '5.54.1',
    path: 'dist/index.min.js',
  },
  {
    package: '@typescript-eslint/scope-manager',
    version: '5.54.1',
    path: 'dist/analyze.min.js',
    directories: [
      'dist/lib',
      'dist/referencer',
      'dist/definition',
      'dist/scope',
      'dist/variable',
    ],
  },
  {
    package: 'eslint-visitor-keys',
    version: '3.3.0',
    path: 'dist/eslint-visitor-keys.cjs',
  },
  {
    package: '@typescript-eslint/types',
    version: '5.54.1',
    path: 'dist/index.min.js',
  },
  {
    package: '@typescript-eslint/eslint-plugin',
    version: '5.54.1',
    path: 'dist/index.min.js',
    directories: ['dist/rules'],
  },
  {
    package: '@typescript-eslint/utils',
    version: '5.54.1',
    path: 'dist/index.min.js',
    directories: [
      'dist/ast-utils',
      'dist/ast-utils/eslint-utils',
      'dist/eslint-utils',
      'dist/ts-eslint-scope',
    ],
  },
  {
    package: '@typescript-eslint/typescript-estree',
    version: '5.54.1',
    path: 'dist/ast-converter.min.js',
    directories: ['dist/ts-estree'],
  },
  {
    package: 'eslint-utils',
    version: '3.0.0',
    path: 'index.min.js',
  },
  {
    package: 'eslint-scope',
    version: '7.1.1',
    path: 'dist/eslint-scope.cjs',
  },
  {
    package: 'estraverse',
    version: '5.3.0',
    path: 'estraverse.min.js',
  },
  {
    package: 'esrecurse',
    version: '4.3.0',
    path: 'esrecurse.min.js',
  },
]);

const scopeManager = window.require('@typescript-eslint/scope-manager');
const visitorKeys = window.require(
  '@typescript-eslint/visitor-keys/dist/visitor-keys'
);
const typescriptEstree = window.require('@typescript-eslint/typescript-estree');
const getScriptKind = window.require(
  '@typescript-eslint/typescript-estree/dist/create-program/getScriptKind'
);
const rules = window.require('@typescript-eslint/eslint-plugin');

export { rules, getScriptKind, typescriptEstree, visitorKeys, scopeManager };
