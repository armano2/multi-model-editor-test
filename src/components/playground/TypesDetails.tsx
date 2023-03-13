import React, { useMemo, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useMedia } from 'react-use';
import type * as ts from 'typescript';

import ASTViewer from '../ast/ASTViewer';
import astStyles from '../ast/ASTViewer.module.css';
import { tsEnumValue } from '../ast/tsUtils';
import Link from '../inputs/Link';
import playgroundStyles from './playground.module.css';

export interface TypesDetailsProps {
  readonly value: ts.Node;
  readonly program?: ts.Program;
}

interface SimplifiedItemProps {
  readonly value: ts.Node;
  readonly indent: number;
  readonly onSelect: (value: ts.Node) => void;
}

function SimplifiedItem({
  value,
  indent,
  onSelect,
}: SimplifiedItemProps): JSX.Element {
  const items = useMemo(() => {
    const result: ts.Node[] = [];
    value.forEachChild((child) => {
      result.push(child);
    });
    return result;
  }, [value]);

  return (
    <>
      <div>
        <Link
          href={`#${value.kind}`}
          className={astStyles.tokenName}
          style={{ marginLeft: `${indent * 10}px` }}
          onClick={(e): void => {
            e.preventDefault();
            onSelect(value);
          }}
        >
          {tsEnumValue('SyntaxKind', value.kind)}
        </Link>
      </div>
      {items.map((item, index) => {
        return (
          <SimplifiedItem
            indent={indent + 1}
            value={item}
            onSelect={onSelect}
            key={index.toString()}
          />
        );
      })}
    </>
  );
}

interface InfoModel {
  type?: unknown;
  symbol?: unknown;
}

export function TypeInfo({ value, program }: TypesDetailsProps): JSX.Element {
  const computed = useMemo(() => {
    if (!program) {
      return undefined;
    }
    const info: InfoModel = {};
    const typeChecker = program.getTypeChecker();
    try {
      info.type = typeChecker.getTypeAtLocation(value);
    } catch (e: unknown) {
      info.type = e;
    }
    try {
      info.symbol = typeChecker.getSymbolAtLocation(value);
    } catch (e: unknown) {
      info.symbol = e;
    }

    return info;
  }, [value, program]);

  if (!program || !computed) {
    return <div>Program not available</div>;
  }

  return (
    <div>
      <>
        <h3>Node</h3>
        <ASTViewer value={value} />
        <h3>Type</h3>
        {computed.type && <ASTViewer value={computed.type} />}
        <h3>Symbol</h3>
        {computed.symbol && <ASTViewer value={computed.symbol} />}
      </>
    </div>
  );
}

export function TypesDetails(props: TypesDetailsProps): JSX.Element {
  const isWide = useMedia('(min-width: 1280px)');
  const [selectedNode, setSelectedNode] = useState<ts.Node>();

  return (
    <PanelGroup
      autoSaveId="playground-types"
      direction={isWide ? 'horizontal' : 'vertical'}
    >
      <Panel id="simplifiedTree" defaultSize={35} collapsible={true}>
        <div className={playgroundStyles.playgroundInfoContainer}>
          <div className={astStyles.list}>
            <SimplifiedItem
              onSelect={setSelectedNode}
              indent={0}
              value={props.value}
            />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className={playgroundStyles.PanelResizeHandle} />
      <Panel id="typeInfo" collapsible={true}>
        <div className={playgroundStyles.playgroundInfoContainer}>
          {selectedNode && (
            <TypeInfo program={props.program} value={selectedNode} />
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
}
