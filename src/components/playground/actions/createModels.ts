import type * as Monaco from 'monaco-editor';

import type { PlaygroundSystem } from '../types';
import { applyEdit } from './utils';

export function determineLanguage(file: string): string {
  if (/\.ts(x)?$/.test(file)) {
    return 'typescript';
  }
  if (/\.(json|eslintrc)$/.test(file)) {
    return 'json';
  }
  return 'plaintext';
}

export function createModels(
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  system: PlaygroundSystem
): void {
  const files = system.readDirectory('/');
  files.forEach((fileName) => {
    if (!fileName.endsWith('.d.ts')) {
      const uri = monaco.Uri.file(fileName);
      const model = monaco.editor.getModel(uri);
      if (!model) {
        monaco.editor.createModel(
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          system.readFile(fileName) || '\n',
          determineLanguage(fileName),
          uri
        );
      }
    }
  });

  system.watchDirectory('/', (fileName) => {
    if (editor.hasTextFocus()) {
      return;
    }

    const model = monaco.editor.getModel(monaco.Uri.file(fileName));
    if (model) {
      const code = system.readFile(fileName) ?? '\n';
      if (model.getValue() !== code) {
        applyEdit(model, editor, {
          range: model.getFullModelRange(),
          text: code,
        });
      }
    }
  });
}
