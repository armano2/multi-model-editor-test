import type * as Monaco from 'monaco-editor';

import type { PlaygroundSystem } from '../types';
import { applyEdit } from './utils';

export function determineLanguage(file: string): string {
  if (/\.ts(x)?$/.test(file)) {
    return 'typescript';
  }
  if (/\.js(x)?$/.test(file)) {
    return 'javascript';
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
