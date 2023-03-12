import React, { type ComponentProps } from 'react';

import { ReactComponent as ExternalLinkIcon } from '../../icons/externalLink.svg';
import styles from './Link.module.css';

export interface LinkProps extends ComponentProps<'a'> {
  readonly className?: string;
}

function Link({ className, children, ...props }: LinkProps): JSX.Element {
  return (
    <a className={className} {...props}>
      {React.Children.map(children, (child) => child)}
      {props.target === '_blank' && (
        <ExternalLinkIcon className={styles.linkIcon} />
      )}
    </a>
  );
}

export default Link;
