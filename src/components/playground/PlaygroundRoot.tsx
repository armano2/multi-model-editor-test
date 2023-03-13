import type * as ESQuery from 'esquery';
import React, { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useMedia } from 'react-use';

import ASTViewer from '../ast/ASTViewer';
import ConfigEslint from '../config/ConfigEslint';
import ConfigTypeScript from '../config/ConfigTypeScript';
import useHashState from '../hooks/useHashState';
import EditorTabs from '../layout/EditorTabs';
import { createFileSystem } from '../linter/bridge';
import type { UpdateModel } from '../linter/types';
import { isCodeFile } from '../linter/utils';
import { debounce } from '../util/debounce';
import { defaultConfig, detailTabs } from './config';
import { ErrorsViewer } from './ErrorsViewer';
import { ESQueryFilter } from './ESQueryFilter';
import Options from './Options';
import styles from './playground.module.css';
import PlaygroundEditor from './PlaygroundEditor';
import type { ErrorGroup, PlaygroundSystem } from './types';
import { TypesDetails } from './TypesDetails';

function PlaygroundRoot(): JSX.Element {
  const [config, setConfig] = useHashState(defaultConfig);

  const [system] = useState<PlaygroundSystem>(() => createFileSystem(config));
  const [activeFile, setFileName] = useState(`file.${config.fileType}`);
  const [editorFile, setEditorFile] = useState(`file.${config.fileType}`);

  const [errors, setErrors] = useState<ErrorGroup[]>([]);
  const [astModel, setAstModel] = useState<UpdateModel>();
  const [esQueryFilter, setEsQueryFilter] = useState<ESQuery.Selector>();
  const [showModal, setShowModal] = useState<string | false>(false);
  const [selectedRange, setSelectedRange] = useState<[number, number]>();
  const [cursorPosition, onCursorChange] = useState<number>();

  // TODO: should we auto disable this on mobile
  const [enableScrolling, setEnableScrolling] = useState<boolean>(true);

  const isWide = useMedia('(min-width: 1280px)');

  useEffect(() => {
    const dispose = system.watchDirectory(
      '/',
      debounce((fileName) => {
        if (isCodeFile(fileName)) {
          const code = system.readFile(fileName);
          if (config.code !== code) {
            setConfig({ code });
          }
        } else if (fileName === '/.eslintrc') {
          const eslintrc = system.readFile(fileName);
          if (config.eslintrc !== eslintrc) {
            setConfig({ eslintrc });
          }
        } else if (fileName === '/tsconfig.json') {
          const tsconfig = system.readFile(fileName);
          if (config.tsconfig !== tsconfig) {
            setConfig({ tsconfig });
          }
        }
      }, 500)
    );
    return () => {
      dispose.close();
    };
  }, [config, setConfig, system]);

  useEffect(() => {
    const newFile = `file.${config.fileType}`;
    if (newFile !== editorFile) {
      if (editorFile === activeFile) {
        setFileName(newFile);
      }
      setEditorFile(newFile);
    }
  }, [config, system, editorFile, activeFile]);

  return (
    <>
      <ConfigEslint
        system={system}
        isOpen={showModal === '.eslintrc'}
        onClose={setShowModal}
      />
      <ConfigTypeScript
        system={system}
        isOpen={showModal === 'tsconfig.json'}
        onClose={setShowModal}
      />
      <PanelGroup
        className={styles.panelGroup}
        autoSaveId="playground-resize"
        direction={isWide ? 'horizontal' : 'vertical'}
      >
        <Panel
          id="playgroundMenu"
          className={styles.PanelRow}
          defaultSize={13}
          collapsible={true}
        >
          <div className={styles.playgroundMenu}>
            <Options
              config={config}
              setConfig={setConfig}
              enableScrolling={enableScrolling}
              setEnableScrolling={setEnableScrolling}
            />
          </div>
        </Panel>
        <PanelResizeHandle className={styles.PanelResizeHandle} />
        <Panel
          id="playgroundEditor"
          className={styles.PanelRow}
          collapsible={true}
        >
          <div className={styles.playgroundEditor}>
            <EditorTabs
              tabs={[editorFile, '.eslintrc', 'tsconfig.json']}
              active={activeFile}
              change={setFileName}
              showModal={setShowModal}
            />
            <PlaygroundEditor
              tsEsVersion={config.tse}
              tsVersion={config.ts}
              onUpdate={setAstModel}
              system={system}
              activeFile={activeFile}
              onValidate={setErrors}
              onCursorChange={onCursorChange}
              selectedRange={selectedRange}
            />
          </div>
        </Panel>
        <PanelResizeHandle className={styles.PanelResizeHandle} />
        <Panel
          id="playgroundInfo"
          className={styles.PanelRow}
          defaultSize={50}
          collapsible={true}
        >
          <div className={styles.playgroundInfoContainer}>
            <div className={styles.playgroundInfoHeader}>
              <EditorTabs
                tabs={detailTabs}
                active={config.showAST ?? false}
                change={(v): void => setConfig({ showAST: v })}
              />
              {config.showAST === 'es' && (
                <ESQueryFilter onChange={setEsQueryFilter} />
              )}
            </div>
            <div className={styles.playgroundInfo}>
              {!config.showAST || !astModel ? (
                <ErrorsViewer value={errors} />
              ) : config.showAST === 'types' && astModel.storedTsAST ? (
                <TypesDetails
                  program={astModel.program}
                  value={astModel.storedTsAST}
                  cursorPosition={cursorPosition}
                />
              ) : (
                <ASTViewer
                  key={config.showAST}
                  filter={config.showAST === 'es' ? esQueryFilter : undefined}
                  value={
                    config.showAST === 'ts'
                      ? astModel.storedTsAST
                      : config.showAST === 'scope'
                      ? astModel.storedScope
                      : astModel.storedAST
                  }
                  enableScrolling={enableScrolling}
                  cursorPosition={cursorPosition}
                  onSelectNode={setSelectedRange}
                />
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
}

export default PlaygroundRoot;
