import React, { useState, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { EditorFile } from './config';
import { useMount } from 'react-use';
import useColorMode from '../hooks/useColorMode';
import type { ErrorGroup } from './types';
import { parseMarkers } from './utils';
import Loader from '../layout/Loader';

export interface PlaygroundProps {
  readonly file: EditorFile;
  readonly tsVersion: string;
  readonly onValidate: (markers: ErrorGroup[]) => void;
}

function PlaygroundEditor({ file, tsVersion, onValidate }: PlaygroundProps) {
  const [isLoading, setLoading] = useState<boolean>(true);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor>();
  const [_monaco, setMonaco] = useState(() => loader.__getMonacoInstance());
  const [colorMode] = useColorMode();

  useMount(() => {
    loader.config({
      paths: {
        vs: `https://typescript.azureedge.net/cdn/${tsVersion}/monaco/min/vs`,
      },
    });

    const cancelable = loader.init();
    cancelable.then((monaco) => {
      setMonaco(monaco);

      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
      });
      setLoading(false);
    });
  });

  if (isLoading) {
    return <Loader />;
  }

  const onEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    editor.updateOptions({
      minimap: {
        enabled: false,
      },
      fontSize: 13,
      wordWrap: 'off',
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      wrappingIndent: 'same',
      hover: { above: false },
    });
  };

  return (
    <Editor
      theme={colorMode === 'dark' ? 'vs-dark' : 'vs-light'}
      path={file.name}
      defaultLanguage={file.language}
      defaultValue={file.value}
      onMount={onEditorDidMount}
      onValidate={(markers) => {
        onValidate(parseMarkers(markers));
      }}
    />
  );
}

export default PlaygroundEditor;
