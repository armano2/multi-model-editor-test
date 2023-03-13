import React, { useCallback, useMemo } from 'react';
import type * as ts from 'typescript';

import astStyles from '../ast/ASTViewer.module.css';
import PropertyName from '../ast/PropertyName';
import { tsEnumValue } from '../ast/tsUtils';
import type { OnHoverNodeFn } from '../ast/types';
import { getRange, isTSNode } from '../ast/utils';

export interface SimplifiedItemProps {
  readonly value: ts.Node;
  readonly selectedNode: ts.Node | undefined;
  readonly onSelect: (value: ts.Node) => void;
  readonly onHoverNode?: OnHoverNodeFn;
}

export function SimplifiedItem({
  value,
  onSelect,
  selectedNode,
  onHoverNode,
}: SimplifiedItemProps): JSX.Element {
  const items = useMemo(() => {
    const result: ts.Node[] = [];
    value.forEachChild((child) => {
      result.push(child);
    });
    return result;
  }, [value]);

  const onHover = useCallback(
    (v: boolean) => {
      if (isTSNode(value) && onHoverNode) {
        return onHoverNode(v ? getRange(value, 'tsNode') : undefined);
      }
    },
    [onHoverNode, value]
  );

  return (
    <div className={astStyles.expand}>
      <span className={selectedNode === value ? astStyles.selected : ''}>
        <PropertyName
          propName={tsEnumValue('SyntaxKind', value.kind)}
          onHover={onHover}
          onClick={(e): void => {
            e.preventDefault();
            onSelect(value);
          }}
        />
      </span>

      <div className={astStyles.subList}>
        {items.map((item, index) => {
          return (
            <SimplifiedItem
              onHoverNode={onHoverNode}
              selectedNode={selectedNode}
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
