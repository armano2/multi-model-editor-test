import type * as ESQuery from 'esquery';
import React, { useEffect, useMemo } from 'react';

import CopyButton from '../inputs/CopyButton';
import type { UpdateModel } from '../linter/types';
import { debounce } from '../util/debounce';
import { scrollIntoViewIfNeeded } from '../util/scroll-into';
import styles from './ASTViewer.module.css';
import ElementItem from './ElementItem';
import { findSelectionPath } from './selectedRange';
import type { OnSelectNodeFn } from './types';
import { getTooltipLabel, getTypeName } from './utils';

export interface ASTViewerProps {
  readonly cursorPosition?: number;
  readonly onSelectNode: OnSelectNodeFn;
  readonly value: UpdateModel;
  readonly tab: false | string;
  readonly filter?: ESQuery.Selector;
  readonly enableScrolling?: boolean;
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
  cursorPosition,
  onSelectNode,
  value,
  tab,
  filter,
  enableScrolling,
}: ASTViewerProps): JSX.Element {
  const model = useMemo(() => {
    if (tab === 'ts') {
      return value.storedTsAST;
    } else if (tab === 'scope') {
      return value.storedScope;
    } else if (tab === 'es') {
      return tryToApplyFilter(value.storedAST, filter);
    } else {
      return [];
    }
  }, [value, filter, tab]);

  const selectedPath = useMemo(() => {
    if (cursorPosition == null || !model || typeof model !== 'object') {
      return 'ast';
    }
    return findSelectionPath(model, cursorPosition).join('.');
  }, [cursorPosition, model]);

  useEffect(() => {
    if (enableScrolling) {
      const delayed = debounce(() => {
        const htmlElement = document.querySelector(
          `div[data-level="${selectedPath}"]`
        );
        if (htmlElement) {
          scrollIntoViewIfNeeded(htmlElement);
        }
      }, 100);
      delayed();
    }
  }, [selectedPath, enableScrolling]);

  return (
    <div className={styles.list}>
      <ElementItem
        getTypeName={getTypeName}
        value={model}
        level="ast"
        onSelectNode={onSelectNode}
        selectedPath={selectedPath}
        getTooltipLabel={getTooltipLabel}
      />
      <CopyButton value={model} />
    </div>
  );
}

export default ASTViewer;
