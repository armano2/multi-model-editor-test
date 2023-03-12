import type * as ts from 'typescript';

export function createCompilerOptions(
  tsConfig: Record<string, unknown> = {}
): ts.CompilerOptions {
  const config = window.ts.convertCompilerOptionsFromJson(
    {
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

  const options = config.options;

  if (!options.lib) {
    options.lib = [window.ts.getDefaultLibFileName(options)];
  }

  return options;
}
