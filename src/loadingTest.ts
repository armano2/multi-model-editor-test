import { importer } from './require';
import * as tsutils from 'tsutils';

importer.mocks = {
  '/npm/typescript@4.9.5/+esm': () => {
    // TODO: use window.ts
    const ts = importer.importFile(
      '/npm/@typescript-deploys/monaco-typescript@4.5.1-rc/release/esm/lib/typescriptServices.js/+esm',
      false
    );
    return ts;
  },
  '/npm/semver@7.3.8/+esm': () => {
    const satisfies = () => true;
    const major = importer.importFile(
      '/npm/semver@7.3.8/functions/major'
    ).default;
    return { satisfies, major };
  },
  '/npm/tsutils@3.21.0/+esm': () => {
    return tsutils;
  },
  '/npm/tsutils@3.21.0/util/util/+esm': () => {
    return tsutils;
  },
  '/npm/eslint@8.35.0/use-at-your-own-risk/+esm': () => {
    // TODO: use window.eslint
    return {
      builtinRules: {
        get(_name: string) {
          return {
            meta: {
              schema: {
                properties: { overrides: { properties: { import: '' } } },
              },
            },
          };
        },
      },
    };
  },
  '/npm/globals@13.20.0/+esm': () => {
    return importer.importFile('/npm/globals@13.20.0/globals.json').default;
  },
  '/npm/eslint@8.35.0/+esm': () => {
    // TODO: use window.ts
    class Linter {}
    class RuleTester {}
    class SourceCode {}
    return {
      SourceCode,
      Linter,
      RuleTester,
    };
  },
  '/npm/@typescript-eslint/utils@5.54.1/+esm': () => {
    const utils = importer.importFile(
      '/npm/@typescript-eslint/utils@5.54.1/dist/index.js/+esm'
    );
    return utils.default;
  },
  '/npm/debug@4.3.4/+esm': () => {
    const debug = importer.importFile('/npm/debug@4.3.4/src/browser.js/+esm');
    return debug.default;
  },
  '/npm/@typescript-eslint/typescript-estree@5.54.1/+esm': () => {
    const astConverter = importer.importFile(
      '/npm/@typescript-eslint/typescript-estree@5.54.1/dist/ast-converter.js/+esm'
    );
    const types = importer.importFile(
      '/npm/@typescript-eslint/types@5.54.1/+esm'
    );
    return {
      ...types,
      astConverter: astConverter.astConverter,
    };
  },
};

const result = importer.importFiles([
  '/npm/@typescript-eslint/scope-manager',
  '/npm/@typescript-eslint/visitor-keys/dist/visitor-keys',
  '/npm/@typescript-eslint/typescript-estree@5.54.1/dist/ast-converter.js',
  '/npm/@typescript-eslint/typescript-estree@5.54.1/dist/create-program/getScriptKind',
  // '/npm/@typescript-eslint/eslint-plugin' // TODO: fix me
]);

console.log(result);

export {};
