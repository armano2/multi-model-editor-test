import React, { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useMedia } from 'react-use';
import type * as ts from 'typescript';

import astStyles from '../ast/ASTViewer.module.css';
import { findSelectionPath } from '../ast/selectedRange';
import type { OnHoverNodeFn } from '../ast/types';
import { isTSNode } from '../ast/utils';
import playgroundStyles from '../playground/playground.module.css';
import { SimplifiedItem } from './SimplifiedItem';
import { TypeInfo } from './TypeInfo';

export interface TypesDetailsProps {
  readonly value: ts.Node;
  readonly program?: ts.Program;
  readonly cursorPosition?: number;
  readonly onHoverNode?: OnHoverNodeFn;
}

export function TypesDetails({
  cursorPosition,
  value,
  program,
  onHoverNode,
}: TypesDetailsProps): JSX.Element {
  const isWide = useMedia('(min-width: 1280px)');
  const [selectedNode, setSelectedNode] = useState<ts.Node>(value);

  useEffect(() => {
    if (cursorPosition) {
      const item = findSelectionPath(value, cursorPosition);
      if (item.node && isTSNode(item.node)) {
        setSelectedNode(item.node);
      }
    }
  }, [cursorPosition, value]);

  return (
    <PanelGroup
      autoSaveId="playground-types"
      direction={isWide ? 'horizontal' : 'vertical'}
    >
      <Panel id="simplifiedTree" defaultSize={35} collapsible={true}>
        <div className={playgroundStyles.playgroundInfoContainer}>
          <div className={astStyles.list}>
            <SimplifiedItem
              onHoverNode={onHoverNode}
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              value={value}
            />
          </div>
        </div>
      </Panel>
      <PanelResizeHandle className={playgroundStyles.PanelResizeHandle} />
      {selectedNode && (
        <Panel id="typeInfo" collapsible={true}>
          <div className={playgroundStyles.playgroundInfoContainer}>
            <TypeInfo
              onHoverNode={onHoverNode}
              onSelect={setSelectedNode}
              program={program}
              value={selectedNode}
            />
          </div>
        </Panel>
      )}
    </PanelGroup>
  );
}
