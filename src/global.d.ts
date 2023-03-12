import 'monaco-editor/esm/vs/editor/editor.api';

import type esquery from 'esquery';
import type * as ts from 'typescript';

declare module 'monaco-editor/esm/vs/editor/editor.api' {
  namespace languages.typescript {
    export interface TypeScriptWorker {
      /**
       * https://github.com/microsoft/TypeScript-Website/blob/246798df5013036bd9b4389932b642c20ab35deb/packages/playground-worker/types.d.ts#L48
       */
      getLibFiles(): Promise<Record<string, string>>;
    }
  }
}

declare global {
  interface Window {
    ts: typeof ts;
    esquery: typeof esquery;
  }
}

declare module 'typescript' {
  export interface OptionDeclarations {
    name: string;
    type?: unknown;
    category?: { message: string };
    description?: { message: string };
    element?: {
      type: unknown;
    };

    isCommandLineOnly?: boolean;
    affectsEmit?: true;
    affectsModuleResolution?: true;
    affectsSourceFile?: true;
    transpileOptionValue?: true;
  }

  const optionDeclarations: OptionDeclarations[];
}
