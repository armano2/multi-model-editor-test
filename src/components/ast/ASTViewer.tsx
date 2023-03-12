import type * as ESQuery from 'esquery';
import React, { useMemo } from 'react';

import CopyButton from '../inputs/CopyButton';
import type { UpdateModel } from '../linter/types';
import styles from './ASTViewer.module.css';
import ElementItem from './ElementItem';
import type { OnSelectNodeFn, SelectedRange } from './types';
import { getTooltipLabel, getTypeName } from './utils';

export interface ASTViewerProps {
  readonly selection?: SelectedRange;
  readonly onSelectNode: OnSelectNodeFn;
  readonly value: UpdateModel;
  readonly tab: false | string;
  readonly filter?: ESQuery.Selector;
}

function tryToApplyFilter<T>(value: T, filter?: ESQuery.Selector): T | T[] {
  try {
    if (window.esquery && filter) {
      // @ts-expect-error - esquery requires js ast types
      return window.esquery.match(value, filter);
    }
  } catch (e: unknown) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return value;
}

function ASTViewer({
  selection,
  onSelectNode,
  value,
  tab,
  filter,
}: ASTViewerProps): JSX.Element {
  const model = useMemo(() => {
    if (tab === 'ts') {
      return value.storedTsAST;
    } else if (tab === 'scope') {
      return value.storedScope;
    }
    return tryToApplyFilter(value.storedAST, filter);
  }, [value, filter, tab]);

  return (
    <div className={styles.list}>
      <ElementItem
        getTypeName={getTypeName}
        value={model}
        level="ast"
        selection={selection}
        onSelectNode={onSelectNode}
        getTooltipLabel={getTooltipLabel}
      />
      <CopyButton value={model} />
    </div>
  );
}

export default ASTViewer;
