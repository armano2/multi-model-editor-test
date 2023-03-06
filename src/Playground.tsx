import React, { useState, useRef, useEffect } from "react";
import Editor, { useMonaco, loader } from "@monaco-editor/react";
import useConstructor from "./useConstructor";
import { EditorFile } from "./config";

/*
function setLoaderVersion(tsVersion: string) {
  const tsWorkerPath = `https://typescript.azureedge.net/cdn/${tsVersion}/monaco/min/vs/language/typescript/tsWorker`;
  // const tsWorkerPath =
  //  "https://cdn.jsdelivr.net/npm/@typescript-deploys/monaco-typescript@4.5.1-rc/release/min/tsWorker.js";

  loader.config({
    paths: {
      "vs/language/typescript/tsWorker": tsWorkerPath,
      vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs"
      // `https://typescript.azureedge.net/cdn/${tsVersion}/monaco/min/vs/`
    }
  });
}
*/

window.MonacoEnvironment = {
  getWorkerUrl(moduleId, label) {
    const tsWorkerPath =
      "https://cdn.jsdelivr.net/npm/@typescript-deploys/monaco-typescript@4.5.1-rc/release/min/tsWorker.js";

    switch (label) {
      case "json":
        return new URL("monaco-editor/esm/vs/language/json/json.worker");
      case "javascript":
      case "typescript":
        return new URL(tsWorkerPath);
      default:
        throw new Error(`Unknown label ${label}`);
    }
  }
};

export interface PlaygroundProps {
  readonly file: EditorFile;
  readonly tsVersion: string;
}

function Playground({ file, tsVersion }: PlaygroundProps) {
  const [isLoading, setLoading] = useState<boolean>(true);
  const editorRef = useRef(null);
  const monaco = useMonaco();

  useEffect(() => {
    console.log(monaco);
    if (monaco) {
      console.log(
        monaco.languages.typescript.typescriptVersion,
        monaco.languages.json,
        monaco.languages.typescript
      );
      setLoading(false);
    }
  }, [monaco]);

  useConstructor(() => {
    //setLoaderVersion(tsVersion);
    console.log(monaco);
    /*loader.init().then((monaco) => {
      setLoading(false);
    });*/
    setLoading(false);
  });

  if (isLoading) {
    return <>Loading...</>;
  }

  return (
    <Editor
      height="80vh"
      theme="vs-dark"
      path={file.name}
      defaultLanguage={file.language}
      defaultValue={file.value}
      onMount={(editor) => (editorRef.current = editor)}
    />
  );
}

export default Playground;
