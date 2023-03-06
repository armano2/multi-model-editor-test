import React, { useState, useCallback } from "react";

import Tabs from "./Tabs";
import Dropdown from "./Dropdown";
import Playground from "./Playground";
import { tsVersions, baseFiles, EditorFile } from "./config";

function App() {
  const [tsVersion] = useState<string>(
    () => new URL(window.location.href).searchParams.get("ts") || "4.9.5"
  );

  const [files] = useState<Record<string, EditorFile>>(() => baseFiles);

  const [fileName, setFileName] = useState("script.ts");

  const file = files[fileName];

  const setTsVersion = useCallback((version: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("ts", version);
    window.history.pushState(null, "", url);
    document.location.reload();
  }, []);

  return (
    <>
      <Dropdown
        options={tsVersions}
        value={tsVersion}
        onChange={(value: string) => setTsVersion(value)}
      />
      <Tabs
        tabs={Object.keys(files)}
        active={fileName}
        setActive={setFileName}
      />
      <Playground tsVersion={tsVersion} file={file} />
    </>
  );
}

export default App;
