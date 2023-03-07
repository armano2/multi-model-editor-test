import React, { useState, useCallback, useEffect } from 'react';

import { Panel, PanelGroup } from 'react-resizable-panels';

import { tsVersions, baseFiles, EditorFile } from './config';
import type { ErrorGroup } from './types';
import styles from './playground.module.css';

import Dropdown from '../inputs/Dropdown';
import ResizeHandle from '../layout/ResizeHandle';
import Expander from '../layout/Expander';
import InputLabel from '../layout/InputLabel';
import useColorMode from '../hooks/useColorMode';
import Checkbox from '../inputs/Checkbox';
import EditorTabs from '../layout/EditorTabs';

import PlaygroundEditor from './PlaygroundEditor';
import ErrorsViewer from './ErrorsViewer';

function PlaygroundRoot(): JSX.Element {
  const [tsVersion] = useState<string>(
    () => new URL(window.location.href).searchParams.get('ts') || '4.9.5'
  );

  const [files] = useState<Record<string, EditorFile>>(() => baseFiles);
  const [fileName, setFileName] = useState('script.ts');
  const [colorMode, setColorMode] = useColorMode();
  const [errors, setErrors] = useState<ErrorGroup[]>([]);
  const file = files[fileName];

  const setTsVersion = useCallback((version: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('ts', version);
    window.history.pushState(null, '', url);
    document.location.reload();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorMode ?? 'light');
  }, [colorMode]);

  return (
    <>
      <PanelGroup
        className={styles.panelGroup}
        autoSaveId="playground-resize"
        direction="horizontal"
      >
        <Panel className={styles.PanelRow} defaultSize={10} maxSize={20}>
          <div className={styles.playgroundMenu}>
            <Expander label="Options">
              <InputLabel name="theme">
                <Checkbox
                  name="theme"
                  checked={colorMode === 'dark'}
                  onChange={(value) => setColorMode(value ? 'dark' : 'light')}
                />
              </InputLabel>
              <InputLabel name="TypeScript">
                <Dropdown
                  options={tsVersions}
                  name="ts-version"
                  value={tsVersion}
                  onChange={(value: string) => setTsVersion(value)}
                />
              </InputLabel>
            </Expander>
          </div>
        </Panel>
        <ResizeHandle />
        <Panel className={styles.PanelRow}>
          <div className={styles.playgroundEditor}>
            <EditorTabs
              tabs={Object.keys(files)}
              active={fileName}
              change={setFileName}
              showModal={(): void => {}}
            />
            <PlaygroundEditor
              tsVersion={tsVersion}
              file={file}
              onValidate={setErrors}
            />
          </div>
        </Panel>
        <ResizeHandle />
        <Panel className={styles.PanelRow} defaultSize={50}>
          <div className={styles.playgroundInfo}>
            <ErrorsViewer value={errors} />
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
}

export default PlaygroundRoot;
