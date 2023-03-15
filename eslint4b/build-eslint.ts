/* eslint-disable no-console, no-process-exit */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import commonjsPlugin from '@chialab/esbuild-plugin-commonjs';
import * as esbuild from 'esbuild';

import { jsDeliverImports } from './plugins';
import { readPackageJSON, requireResolved } from './utils';

const globalExternals = [
  'typescript',
  'eslint-visitor-keys',
  'esquery',
  'path',
  '@eslint-community/eslint-utils',
  'eslint',
  'eslint-scope',
  '@typescript-eslint/scope-manager',
  '@typescript-eslint/visitor-keys',
  '@typescript-eslint/typescript-estree',
  '@typescript-eslint/types',
  '@typescript-eslint/parser',
  '@typescript-eslint/utils',
];

async function buildPackage(
  name: string,
  file: string,
  packageName: string
): Promise<void> {
  console.log('Building package', packageName);

  const packageJson = await readPackageJSON(packageName);

  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const devDependencies = Object.keys(packageJson.devDependencies ?? {});
  const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

  const externals = [
    ...new Set([
      ...dependencies,
      ...devDependencies,
      ...peerDependencies,
      ...globalExternals,
    ]),
  ].filter((i) => i !== packageName);

  const eslintRoot = requireResolved('eslint/package.json');
  const linterPath = path.join(eslintRoot, '../lib/linter/linter.js');

  const buildResult = await esbuild.build({
    entryPoints: {
      [name]: requireResolved(file),
    },
    format: 'esm',
    platform: 'browser',
    bundle: true,
    external: externals,
    minify: true,
    treeShaking: true,
    write: false,
    target: 'es2020',
    sourcemap: 'linked',
    outdir: './public/play/',
    supported: {
      'dynamic-import': true,
      'export-star-as': true,
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      'process.env.NODE_DEBUG': 'false',
      'process.env.IGNORE_TEST_WIN32': 'true',
      'process.env.DEBUG': 'false',
      'process.emitWarning': 'console.warn',
      'process.platform': '"browser"',
      'process.env.TIMING': 'undefined',
      // 'process.cwd': '(() => "/")',
      // 'process.env': 'undefined',
      // process: 'undefined',
    },
    alias: {
      util: requireResolved('./mocks/util.mjs'),
      assert: requireResolved('./mocks/assert.mjs'),
      path: requireResolved('./mocks/path.mjs'),
      globby: requireResolved('./mocks/globby.mjs'),
      'virtual:eslint-linter': linterPath,
      'virtual:eslint-rules': path.join(eslintRoot, '../lib/rules/index.js'),
      typescript: requireResolved('./mocks/typescript.mjs'),
    },
    plugins: [commonjsPlugin()],
  });

  for (const file of buildResult.outputFiles) {
    let code = file.text;
    if (file.path.endsWith('.js')) {
      code = await jsDeliverImports(code);
    }
    await fs.writeFile(file.path, code);
  }
}

async function buildEslint4b(): Promise<void> {
  const root = new URL('../public/play/', import.meta.url);
  await fs.rm(root, { recursive: true, force: true });
  await fs.mkdir(root, { recursive: true });

  await buildPackage(`eslint`, `./src/eslint.mjs`, 'eslint');

  await buildPackage(
    `ts-scope-manager`,
    `./src/ts-scope-manager.mjs`,
    '@typescript-eslint/scope-manager'
  );

  await buildPackage(
    `ts-visitor-keys`,
    `./src/ts-visitor-keys.mjs`,
    '@typescript-eslint/visitor-keys'
  );

  await buildPackage(
    `ts-typescript-estree`,
    `./src/ts-typescript-estree.mjs`,
    '@typescript-eslint/typescript-estree'
  );

  await buildPackage(
    `ts-utils`,
    '@typescript-eslint/utils',
    '@typescript-eslint/utils'
  );

  await buildPackage(
    `ts-types`,
    '@typescript-eslint/types',
    '@typescript-eslint/types'
  );

  await buildPackage(
    `ts-eslint-plugin`,
    '@typescript-eslint/eslint-plugin/dist/rules',
    '@typescript-eslint/eslint-plugin'
  );
}

console.time('building eslint for web');

buildEslint4b()
  .then(() => {
    console.timeEnd('building eslint for web');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
