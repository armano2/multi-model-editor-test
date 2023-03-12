/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import clsx from 'clsx';
import type { MouseEvent } from 'react';
import React, { useCallback, useEffect } from 'react';

import { ReactComponent as CloseIcon } from '../../icons/close.svg';
import styles from './Modal.module.css';

interface ModalProps {
  readonly header: string;
  readonly children: JSX.Element | (JSX.Element | false)[];
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function Modal(props: ModalProps): JSX.Element {
  const { onClose } = props;

  useEffect(() => {
    const closeOnEscapeKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };

    document.body.addEventListener('keydown', closeOnEscapeKeyDown);
    return (): void => {
      document.body.removeEventListener('keydown', closeOnEscapeKeyDown);
    };
  }, [onClose]);

  const onClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.currentTarget === e.target) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className={clsx(styles.modal, props.isOpen ? styles.open : '')}
      onClick={onClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(styles.modalContent, 'item shadow--md')}
      >
        <div className={styles.modalHeader}>
          <h2>{props.header}</h2>
          <button
            aria-label="Close"
            onClick={props.onClose}
            className={clsx(styles.modalClose, 'clean-btn')}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.modalBody}>
          {React.Children.map(props.children, (child) => child)}
        </div>
      </div>
    </div>
  );
}

export default Modal;
