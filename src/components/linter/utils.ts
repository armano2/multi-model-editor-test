import type * as ts from 'typescript';

export function createCompilerOptions(
  tsConfig: Record<string, unknown> = {}
): ReturnType<typeof ts.convertCompilerOptionsFromJson> {
  const config = window.ts.convertCompilerOptionsFromJson(
    {
      allowJs: true,
      jsx: 'preserve',
      target: 'esnext',
      module: 'esnext',
      ...tsConfig,
      lib: Array.isArray(tsConfig.lib) ? tsConfig.lib : undefined,
      moduleResolution: undefined,
      plugins: undefined,
      typeRoots: undefined,
      paths: undefined,
      moduleDetection: undefined,
      baseUrl: undefined,
    },
    '/tsconfig.json'
  );

  if (!config.options.lib) {
    config.options.lib = [window.ts.getDefaultLibFileName(config.options)];
  }

  return config;
}

export function isCodeFile(fileName: string): boolean {
  return /^\/file\.(tsx?|jsx?|d\.ts)$/.test(fileName);
}

export function isEslintrcFile(fileName: string): boolean {
  return fileName === '/.eslintrc';
}

export function isTSConfigFile(fileName: string): boolean {
  return fileName === '/tsconfig.json';
}
