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
  readonly onSelect: (value: ts.Node) => void;
}

function SimplifiedItem({ value, onSelect }: SimplifiedItemProps): JSX.Element {
  const items = useMemo(() => {
    const result: ts.Node[] = [];
    value.forEachChild((child) => {
      result.push(child);
    });
    return result;
  }, [value]);

  return (
    <div className={astStyles.expand}>
      <Link
        href={`#${value.kind}`}
        className={astStyles.tokenName}
        onClick={(e): void => {
          e.preventDefault();
          onSelect(value);
        }}
      >
        {tsEnumValue('SyntaxKind', value.kind)}
      </Link>
      <div className={astStyles.subList}>
        {items.map((item, index) => {
          return (
            <SimplifiedItem
              value={item}
              onSelect={onSelect}
              key={index.toString()}
            />
          );
        })}
      </div>
    </div>
  );
}

interface InfoModel {
  type?: unknown;
  symbol?: unknown;
  stringType?: unknown;
  contextualType?: unknown;
  signature?: unknown;
}

export function TypeInfo({ value, program }: TypesDetailsProps): JSX.Element {
  const computed = useMemo(() => {
    if (!program) {
      return undefined;
    }
    const info: InfoModel = {};
    const typeChecker = program.getTypeChecker();
    try {
      const type = typeChecker.getTypeAtLocation(value);
      info.type = type;
      info.stringType = typeChecker.typeToString(type);
    } catch (e: unknown) {
      info.type = e;
      info.stringType = e;
    }
    try {
      // @ts-expect-error just fail if node type is not correct
      info.contextualType = typeChecker.getContextualType(value);
    } catch (_e: unknown) {
      info.contextualType = undefined;
    }
    try {
      info.symbol = typeChecker.getSymbolAtLocation(value);
    } catch (e: unknown) {
      info.symbol = e;
    }
    try {
      // @ts-expect-error just fail if node type is not correct
      info.signature = typeChecker.getResolvedSignature(value);
    } catch (_e: unknown) {
      info.signature = undefined;
    }

    return info;
  }, [value, program]);

  if (!program || !computed) {
    return <div>Program not available</div>;
  }

  return (
    <div>
      <>
        <h4 className="padding--sm margin--none">Node</h4>
        <ASTViewer value={value} />
        <h4 className="padding--sm margin--none">Type</h4>
        {(computed.type && <ASTViewer value={computed.type} />) || (
          <div className={astStyles.list}>None</div>
        )}
        <h4 className="padding--sm margin--none">Type to string</h4>
        {(computed.stringType && <ASTViewer value={computed.stringType} />) || (
          <div className={astStyles.list}>None</div>
        )}
        <h4 className="padding--sm margin--none">Contextual Type</h4>
        {(computed.contextualType && (
          <ASTViewer value={computed.contextualType} />
        )) || <div className={astStyles.list}>None</div>}
        <h4 className="padding--sm margin--none">Symbol</h4>
        {(computed.symbol && <ASTViewer value={computed.symbol} />) || (
          <div className={astStyles.list}>None</div>
        )}
        <h4 className="padding--sm margin--none">Signature</h4>
        {(computed.signature && <ASTViewer value={computed.signature} />) || (
          <div className={astStyles.list}>None</div>
        )}
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
            <SimplifiedItem onSelect={setSelectedNode} value={props.value} />
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
