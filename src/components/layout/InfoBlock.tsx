import React from 'react';

export interface InfoBlockProps {
  readonly type: 'success' | 'info' | 'note' | 'warning' | 'danger';
  readonly children: React.ReactNode;
}

function InfoBlock(props: InfoBlockProps): JSX.Element {
  return (
    <div className={`admonition alert alert--${props.type}`}>
      <div className="admonition-content">{props.children}</div>
    </div>
  );
}

export default InfoBlock;
