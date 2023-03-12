import React, { useState } from 'react';

import styles from './ASTViewer.module.css';
import { objType } from './utils';

export interface PropertyValueProps {
  readonly value: unknown;
}

export type ASTViewerModelTypeSimple =
  | 'ref'
  | 'string'
  | 'number'
  | 'class'
  | 'boolean'
  | 'bigint'
  | 'regexp'
  | 'undefined';

export interface SimpleModel {
  readonly value: string;
  readonly type: ASTViewerModelTypeSimple;
}

export function getSimpleModel(data: unknown): SimpleModel {
  if (typeof data === 'string') {
    return {
      value: JSON.stringify(data),
      type: 'string',
    };
  } else if (typeof data === 'number') {
    return {
      value: String(data),
      type: 'number',
    };
  } else if (typeof data === 'bigint') {
    return {
      value: `${data}n`,
      type: 'bigint',
    };
  } else if (data instanceof RegExp) {
    return {
      value: String(data),
      type: 'regexp',
    };
  } else if (data == null) {
    return {
      value: String(data),
      type: 'undefined',
    };
  } else if (typeof data === 'boolean') {
    return {
      value: data ? 'true' : 'false',
      type: 'boolean',
    };
  }
  return {
    value: objType(data),
    type: 'class',
  };
}

function PropertyValue({ value }: PropertyValueProps): JSX.Element {
  const [model] = useState(() => getSimpleModel(value));

  switch (model.type) {
    case 'string':
      return <span className={styles.propString}>{model.value}</span>;
    case 'bigint':
      return <span className={styles.propNumber}>{model.value}</span>;
    case 'number':
      return <span className={styles.propNumber}>{model.value}</span>;
    case 'regexp':
      return <span className={styles.propRegExp}>{model.value}</span>;
    case 'undefined':
      return <span className={styles.propEmpty}>{model.value}</span>;
    case 'boolean':
      return <span className={styles.propBoolean}>{model.value}</span>;
    case 'class':
    case 'ref':
    default:
      return <span className={styles.propClass}>{model.value}</span>;
  }
}

export default PropertyValue;
