import clsx from 'clsx';
import type Monaco from 'monaco-editor';
import React, { useEffect, useState } from 'react';

import styles from './ErrorsViewer.module.css';
import type { ErrorGroup, ErrorItem } from './types';
import InfoBlock, { InfoBlockProps } from '../layout/InfoBlock';

export interface ErrorsViewerProps {
  readonly value?: ErrorGroup[] | Error;
}

export interface ErrorBlockProps {
  readonly item: ErrorItem;
  readonly setIsLocked: (value: boolean) => void;
  readonly isLocked: boolean;
}

export interface FixButtonProps {
  readonly fix: () => void;
  readonly setIsLocked: (value: boolean) => void;
  readonly disabled: boolean;
}

function severityClass(
  severity: Monaco.MarkerSeverity
): InfoBlockProps['type'] {
  switch (severity) {
    case 8:
      return 'danger';
    case 4:
      return 'warning';
    case 2:
      return 'note';
  }
  return 'info';
}

function FixButton(props: FixButtonProps): JSX.Element {
  return (
    <button
      className="button button--primary button--sm"
      disabled={props.disabled}
      onClick={(): void => {
        props.fix();
        props.setIsLocked(true);
      }}
    >
      fix
    </button>
  );
}

function ErrorBlock({
  item,
  setIsLocked,
  isLocked,
}: ErrorBlockProps): JSX.Element {
  return (
    <InfoBlock type={severityClass(item.severity)}>
      <div className={clsx(!!item.fixer && styles.fixerContainer)}>
        <div>
          {item.message} {item.location}
        </div>
        {item.fixer && (
          <FixButton
            disabled={isLocked}
            fix={item.fixer.fix}
            setIsLocked={setIsLocked}
          />
        )}
      </div>
      {item.suggestions.length > 0 && (
        <div>
          {item.suggestions.map((fixer, index) => (
            <div
              key={index}
              className={clsx(styles.fixerContainer, styles.fixer)}
            >
              <span>&gt; {fixer.message}</span>
              <FixButton
                disabled={isLocked}
                fix={fixer.fix}
                setIsLocked={setIsLocked}
              />
            </div>
          ))}
        </div>
      )}
    </InfoBlock>
  );
}

function ErrorsViewer({ value }: ErrorsViewerProps): JSX.Element {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    setIsLocked(false);
  }, [value]);

  if (value && !Array.isArray(value)) {
    return (
      <div className={styles.list}>
        <div className="margin-top--sm">
          <InfoBlock type="danger">
            <h4>ESLint internal error</h4>
            {value?.stack}
          </InfoBlock>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {value?.length ? (
        value.map(({ group, uri, items }) => {
          return (
            <div className="margin-top--md" key={group}>
              <h4>
                {group}
                {uri && (
                  <>
                    {' - '}
                    <a href={uri} target="_blank">
                      docs
                    </a>
                  </>
                )}
              </h4>
              {items.map((item, index) => (
                <div className="margin-bottom--sm">
                  <ErrorBlock
                    isLocked={isLocked}
                    setIsLocked={setIsLocked}
                    item={item}
                    key={index}
                  />
                </div>
              ))}
            </div>
          );
        })
      ) : (
        <div className="margin-top--md">
          <InfoBlock type="success">
            <div>All is ok!</div>
          </InfoBlock>
        </div>
      )}
    </div>
  );
}

export default ErrorsViewer;
