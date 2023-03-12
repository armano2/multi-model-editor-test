import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';

import useColorMode from '../hooks/useColorMode';
import type { EslintUtilsModule } from '../importer';
import { addLibFiles } from '../linter/bridge';
import { createLinter } from '../linter/createLinter';
import { isCodeFile } from '../linter/utils';
import { createModels, determineLanguage } from './actions/createModels';
import { registerActions } from './actions/registerActions';
import { registerDefaults } from './actions/registerDefaults';
import { registerEvents } from './actions/registerEvents';
import { registerLinter } from './actions/registerLinter';
import type { LintCodeAction } from './actions/utils';
import { defaultEditorOptions } from './config';
import type { PlaygroundProps } from './PlaygroundEditor';

interface PlaygroundLoadedProps extends PlaygroundProps {
  monaco: typeof Monaco;
  utils: EslintUtilsModule;
}

export default function PlaygroundLoaded({
  activeFile,
  system,
  onValidate,
  onUpdate,
  monaco,
  utils,
  selectedRange,
}: PlaygroundLoadedProps): JSX.Element {
  const [colorMode] = useColorMode();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor>();
  const [, setDecorations] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState(() => ({
    path: activeFile,
    language: determineLanguage(activeFile),
    value: system.readFile('/' + activeFile),
  }));

  useEffect(() => {
    const model = monaco.editor.getModel(monaco.Uri.file(activeFile));
    if (model) {
      setDecorations((prevDecorations) =>
        model.deltaDecorations(
          prevDecorations,
          selectedRange
            ? [
                {
                  range: monaco.Range.fromPositions(
                    model.getPositionAt(selectedRange[0]),
                    model.getPositionAt(selectedRange[1])
                  ),
                  options: {
                    inlineClassName: 'myLineDecoration',
                    stickiness: 1,
                  },
                },
              ]
            : []
        )
      );
    }
  }, [selectedRange, monaco, activeFile]);

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    const activeUri = monaco.Uri.file(activeFile);
    let model = monaco.editor.getModel(activeUri);
    if (currentFile.path !== activeUri.path) {
      if (!model) {
        let code: string | undefined = '';
        if (isCodeFile(activeUri.path)) {
          const currentUri = monaco.Uri.file(currentFile.path);
          code = system.readFile(currentUri.path);
          // system.removeFile(currentUri.path);
          monaco.editor.getModel(currentUri)?.dispose();
          system.writeFile(activeUri.path, code ?? '');
        } else {
          code = system.readFile(activeUri.path);
        }
        model = monaco.editor.createModel(
          code ?? '',
          determineLanguage(activeUri.path),
          activeUri
        );
        model.updateOptions({ tabSize: 2, insertSpaces: true });
      }

      setCurrentFile({
        path: activeFile,
        language: determineLanguage(activeFile),
        value: system.readFile(activeUri.path),
      });

      editorRef.current.setModel(model);
    }

    monaco.editor.setModelLanguage(model!, determineLanguage(activeUri.path));
  }, [system, currentFile.path, monaco, editorRef, activeFile]);

  const onEditorDidMount = (
    editor: Monaco.editor.IStandaloneCodeEditor
  ): void => {
    editorRef.current = editor;

    addLibFiles(system, monaco)
      .then(() => {
        const globalActions = new Map<string, Map<string, LintCodeAction[]>>();
        const linter = createLinter(monaco, onUpdate, system, utils);
        registerDefaults(monaco, linter, system);
        createModels(monaco, editor, system);
        registerActions(monaco, editor, linter);
        registerEvents(monaco, editor, system, onValidate, globalActions);
        registerLinter(monaco, editor, linter, globalActions);

        // @ts-expect-error: TODO: remove me, this is only used for debugging
        window.system = system;

        monaco.editor.setModelLanguage(
          editor.getModel()!,
          determineLanguage(currentFile.path)
        );

        linter.lintAllFiles();
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
      });
  };

  return (
    <Editor
      theme={colorMode === 'dark' ? 'vs-dark' : 'vs-light'}
      defaultPath={currentFile.path}
      defaultLanguage="typescript"
      defaultValue={currentFile.value}
      onMount={onEditorDidMount}
      options={defaultEditorOptions}
    />
  );
}
