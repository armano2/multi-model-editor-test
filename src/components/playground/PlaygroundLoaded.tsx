import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import React, { useEffect, useRef, useState } from 'react';

import useColorMode from '../hooks/useColorMode';
import type { EslintUtilsModule } from '../importer';
import { addLibFiles } from '../linter/bridge';
import { createLinter } from '../linter/createLinter';
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
  const [_, setDecorations] = useState<string[]>([]);
  const [defaultFile] = useState(() => ({
    language: determineLanguage(activeFile),
    value: system.readFile('/' + activeFile),
  }));

  useEffect(() => {
    const model = monaco.editor.getModel(monaco.Uri.file('/file.ts'));
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
  }, [selectedRange, monaco]);

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
      path={activeFile}
      defaultLanguage={defaultFile.language}
      defaultValue={defaultFile.value}
      onMount={onEditorDidMount}
      options={defaultEditorOptions}
    />
  );
}
