import type { ImporterOverrides } from './importer';

export const moduleOverrides: ImporterOverrides = {
  typescript: async () => {
    return new Promise((resolve, reject) => {
      window.require(
        ['vs/language/typescript/tsWorker'],
        function () {
          resolve(window.ts);
        },
        function (error: unknown) {
          reject(error);
        }
      );
    });
  },
  // required by semver, but this package can't work in web
  'lru-cache'() {
    return class LruCache {
      cache: Map<string, unknown>;
      constructor() {
        this.cache = new Map();
      }
      get(name: string): unknown {
        return this.cache.get(name);
      }
      set(name: string, value: unknown): unknown {
        this.cache.set(name, value);
        return value;
      }
    };
  },
  tsutils: async (i, meta) => {
    const typeguard = await i.importDefault(
      `/npm/tsutils@${meta.version}/typeguard/index.js/+esm`
    );
    const util = await i.importDefault(
      `/npm/tsutils@${meta.version}/util/index.js/+esm`
    );
    return { ...typeguard, ...util };
  },
  'tsutils/util/util': (i, meta) => {
    return i.importDefault(`/npm/tsutils@${meta.version}/util/index.js/+esm`);
  },
  'eslint/use-at-your-own-risk': async (i) => {
    // TODO: use window.eslint
    const file = await i.importDefault(
      '/npm/eslint4b@7.32.0/dist/core-rules.js'
    );

    return { builtinRules: { get: (name: string): unknown => file[name] } };
  },
  globals: (i, meta) => {
    return i.importFile(`/npm/globals@${meta.version}/globals.json`);
  },
  levn: (i, meta) => {
    return i.importFile(`/npm/levn@${meta.version}/lib/index.js`);
  },
  'prelude-ls': (i, meta) => {
    return i.importFile(`/npm/prelude-ls@${meta.version}/lib/index.js`);
  },
  'type-check': (i, meta) => {
    return i.importFile(`/npm/type-check@${meta.version}/lib/index.js`);
  },
  eslint: async (i) => {
    // TODO: use window.eslint
    const Linter = await i.importDefault('/npm/eslint4b@7.32.0/dist/linter.js');
    const rules = await i.importDefault(
      '/npm/eslint4b@7.32.0/dist/core-rules.js'
    );
    class RuleTester {}
    class SourceCode {}
    return {
      SourceCode,
      Linter,
      RuleTester,
      rules,
    };
  },
  '@typescript-eslint/utils': (i, meta) => {
    return i.importDefault(
      `/npm/@typescript-eslint/utils@${meta.version}/dist/index.js`
    );
  },
  // alias fix for eslint-scope
  '@typescript-eslint/scope-manager/dist/referencer/Visitor': async (
    i,
    meta
  ) => {
    const scope = await i.importFile<{ Visitor: unknown }>(
      `/npm/@typescript-eslint/scope-manager@${meta.version}`
    );
    return { Visitor: scope.Visitor };
  },
  '@typescript-eslint/visitor-keys/dist/visitor-keys': async (i, meta) => {
    const pkg = await i.importFile<{ visitorKeys: unknown }>(
      `/npm/@typescript-eslint/visitor-keys@${meta.version}`
    );
    return { visitorKeys: pkg.visitorKeys };
  },
  debug: (i) => {
    return i.importDefault('/npm/debug@4.3.4/src/browser.js');
  },
  '@typescript-eslint/typescript-estree': async (i, meta) => {
    const astConverter = await i.importFile<{ astConverter: unknown }>(
      `/npm/@typescript-eslint/typescript-estree@${meta.version}/dist/ast-converter.js`
    );
    const types = await i.importDefault(
      `/npm/@typescript-eslint/types@${meta.version}`
    );
    return {
      ...types,
      astConverter: astConverter.astConverter,
    };
  },
};
