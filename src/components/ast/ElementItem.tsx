import React, { useEffect, useMemo, useState } from 'react';

import Tooltip from '../inputs/Tooltip';
import styles from './ASTViewer.module.css';
import HiddenItem from './HiddenItem';
import ItemGroup from './ItemGroup';
import PropertyValue from './PropertyValue';
import type { GetTooltipLabelFn, GetTypeNameFN, OnSelectNodeFn } from './types';
import type { ParentNodeType } from './types';
import { getNodeType, getRange, objType } from './utils';

export interface ElementItemProps {
  readonly getTypeName: GetTypeNameFN;
  readonly getTooltipLabel: GetTooltipLabelFn;
  readonly propName?: string;
  readonly level: string;
  readonly value: unknown;
  readonly onSelectNode: OnSelectNodeFn;
  readonly parentNodeType?: ParentNodeType;
  readonly selectedPath?: string;
}

interface ComputedValueIterable {
  type: string;
  group: 'iterable';
  typeName: string | undefined;
  nodeType: ParentNodeType;
  value: [string, unknown][];
  range?: [number, number];
}

interface ComputedValueSimple {
  type: string;
  group: 'simple';
  tooltip: string | undefined;
}

type ComputedValue = ComputedValueIterable | ComputedValueSimple;

function ElementItem({
  level,
  selectedPath,
  propName,
  value,
  onSelectNode,
  getTypeName,
  getTooltipLabel,
  parentNodeType,
}: ElementItemProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => level === 'ast');
  const isSelected = useMemo(() => {
    return selectedPath === level && level !== 'ast';
  }, [selectedPath, level]);

  const computedValue = useMemo((): ComputedValue => {
    const type = objType(value);
    if ((value && typeof value === 'object') || Array.isArray(value)) {
      const nodeType = getNodeType(type, value, propName);
      return {
        type: type,
        group: 'iterable',
        typeName: getTypeName(type, value, propName, nodeType),
        nodeType: nodeType,
        value: Object.entries(value).filter(
          (item) => item[1] !== undefined && !item[0].startsWith('_')
        ),
        range: getRange(type, value, propName, nodeType),
      };
    } else {
      return {
        type: type,
        group: 'simple',
        tooltip: getTooltipLabel(type, value, propName, parentNodeType),
      };
    }
  }, [value, propName, getTypeName, getTooltipLabel, parentNodeType]);

  useEffect(() => {
    const shouldOpen = !!selectedPath && selectedPath.startsWith(level);
    if (shouldOpen) {
      setIsExpanded((current) => current || shouldOpen);
    }
  }, [selectedPath, level]);

  if (computedValue.group === 'iterable') {
    return (
      <ItemGroup
        level={level}
        propName={propName}
        typeName={computedValue.typeName}
        isExpanded={isExpanded}
        isSelected={isSelected}
        onHover={(v): void => onSelectNode(v ? computedValue.range : undefined)}
        canExpand={true}
        onClick={(): void => setIsExpanded(!isExpanded)}
      >
        <span>{computedValue.type === 'Array' ? '[' : '{'}</span>
        {isExpanded ? (
          <>
            <div className={styles.subList}>
              {computedValue.value.map(([key, item]) => (
                <ElementItem
                  level={`${level}.${key}`}
                  key={`${level}.${key}`}
                  selectedPath={selectedPath}
                  value={item}
                  propName={key}
                  onSelectNode={onSelectNode}
                  getTypeName={getTypeName}
                  getTooltipLabel={getTooltipLabel}
                  parentNodeType={computedValue.nodeType}
                />
              ))}
            </div>
          </>
        ) : (
          <>
            <HiddenItem
              level={level}
              isArray={computedValue.type === 'Array'}
              value={computedValue.value}
            />
          </>
        )}
        <span>{computedValue.type === 'Array' ? ']' : '}'}</span>
      </ItemGroup>
    );
  } else {
    return (
      <ItemGroup level={level} propName={propName}>
        {computedValue.tooltip ? (
          <Tooltip hover={true} position="right" text={computedValue.tooltip}>
            <PropertyValue value={value} />
          </Tooltip>
        ) : (
          <PropertyValue value={value} />
        )}
      </ItemGroup>
    );
  }
}

export default ElementItem;
