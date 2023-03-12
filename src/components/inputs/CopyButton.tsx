import clsx from 'clsx';
import React, { useCallback } from 'react';

import { ReactComponent as CheckIcon } from '../../icons/check.svg';
import { ReactComponent as CopyIcon } from '../../icons/copy.svg';
import { jsonStringifyRecursive } from '../ast/utils';
import useDebouncedToggle from '../hooks/useDebouncedToggle';
import styles from './CopyButton.module.css';
import Tooltip from './Tooltip';

export interface CopyButtonProps {
  readonly value: unknown;
  readonly className?: string;
}

function CopyButton({ value, className }: CopyButtonProps): JSX.Element {
  const [on, toggle] = useDebouncedToggle(true, 3000);

  const onCopy = useCallback(() => {
    void navigator.clipboard
      .writeText(jsonStringifyRecursive(value))
      .then(() => {
        toggle(false);
      });
  }, [value, toggle]);

  return (
    <button
      onClick={onCopy}
      disabled={!on}
      aria-label={on ? 'Copy code to clipboard' : 'Copied'}
      className={clsx(styles.copyButton, className, 'button')}
    >
      <Tooltip open={!on} text="Copied" clasName={styles.copyButtonTooltip}>
        <CopyIcon className={styles.copyIcon} />
        <CheckIcon className={styles.checkIcon} />
      </Tooltip>
    </button>
  );
}

export default CopyButton;
