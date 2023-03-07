import React from 'react';

import { ReactComponent as EditIcon } from '../../icons/edit.svg';
import styles from './EditorTabs.module.css';

export interface EditorTabsProps<T extends string> {
  readonly tabs: T[];
  readonly active: T;
  readonly change: (name: T) => void;
  readonly showModal: () => void;
}

function EditorTabs<T extends string>({
  tabs,
  active,
  change,
  showModal,
}: EditorTabsProps<T>): JSX.Element {
  return (
    <div className={styles.tabContainer}>
      <div role="tablist">
        {tabs.map((item) => (
          <button
            role="tab"
            className={styles.tabStyle}
            key={item}
            aria-selected={active === item}
            disabled={active === item}
            onClick={(): void => change(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {(active === '.eslintrc' || active === 'tsconfig.json') && (
        <button className={styles.tabStyle} onClick={showModal}>
          Visual Editor
          <EditIcon width={12} height={12} />
        </button>
      )}
    </div>
  );
}

export default EditorTabs;
