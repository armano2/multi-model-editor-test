import { useToggle } from 'react-use';
import clsx from 'clsx';
import React from 'react';

import styles from './Expander.module.css';
import { ReactComponent as ArrowIcon } from '../../icons/arrow.svg';

export interface ExpanderProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly label: string;
}

function Expander(props: ExpanderProps): JSX.Element {
  const [collapsed, toggleCollapsed] = useToggle(false);

  return (
    <div className={clsx(styles.expander, props.className)}>
      <button className={styles.heading} onClick={toggleCollapsed}>
        <ArrowIcon
          className={clsx(styles.arrow, !collapsed && styles.expandedArrow)}
        />
        <span className={styles.headerLabel}>{props.label}</span>
      </button>
      {!collapsed && <div className={styles.children}>{props.children}</div>}
    </div>
  );
}

export default Expander;
