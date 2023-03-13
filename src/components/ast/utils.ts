import type { TSESTree } from '@typescript-eslint/utils';
import type * as ts from 'typescript';

import { expandFlags, tsEnumValue } from './tsUtils';
import type { ParentNodeType } from './types';

export function objType(obj: unknown): string {
  const type = Object.prototype.toString.call(obj).slice(8, -1);
  // @ts-expect-error obj[Symbol.iterator]
  if (type === 'Object' && obj && typeof obj[Symbol.iterator] === 'function') {
    return 'Iterable';
  }

  return type;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return objType(value) === 'Object';
}

export function jsonStringifyRecursive(obj: unknown): string {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (key, value: unknown) => {
      if (typeof value === 'object' && value != null) {
        if (cache.has(value)) {
          return;
        }
        cache.add(value);
      }
      return value;
    },
    2
  );
}

export function isESNode(value: object): value is TSESTree.BaseNode {
  return 'type' in value && 'loc' in value && 'range' in value;
}

export function isTSNode(value: object): value is ts.Node {
  return 'kind' in value && 'pos' in value && 'flags' in value;
}

export function getNodeType(
  typeName: string,
  value: unknown,
  propName?: string
): ParentNodeType {
  if (typeName === 'Object' && Boolean(value) && isRecord(value)) {
    if ('childScopes' in value && '$id' in value && 'type' in value) {
      return 'scope';
    } else if (isESNode(value)) {
      return 'esNode';
    } else if ('kind' in value && 'pos' in value && 'flags' in value) {
      return 'tsNode';
    } else if ('getBaseTypes' in value && value.getBaseTypes != null) {
      return 'tsType';
    } else if ('getDeclarations' in value && value.getDeclarations != null) {
      return 'tsSymbol';
    } else if (
      'flags' in value &&
      (propName === 'flowNode' || propName === 'endFlowNode')
    ) {
      return 'tsFlow';
    }
  }
  return undefined;
}

export function ucFirst(value: string): string {
  if (value.length > 0) {
    return value.slice(0, 1).toUpperCase() + value.slice(1, value.length);
  }
  return value;
}

export function getTypeName(
  typeName: string,
  value: unknown,
  _propName?: string,
  valueType?: ParentNodeType
): string | undefined {
  if (typeName === 'Object' && Boolean(value) && isRecord(value)) {
    if (valueType === 'esNode') {
      return String(value.type);
    } else if (valueType === 'tsNode') {
      return tsEnumValue('SyntaxKind', value.kind);
    } else if (valueType === 'scope') {
      return `${ucFirst(String(value.type))}Scope`;
    } else if (valueType === 'tsType') {
      return '[Type]';
    } else if (valueType === 'tsSymbol') {
      return '[Symbol]';
    } else if (valueType === 'tsFlow') {
      return '[FlowNode]';
    }
  }
  return undefined;
}

export function getTooltipLabel(
  typeName: string,
  value: unknown,
  propName?: string,
  parentType?: ParentNodeType
): string | undefined {
  if (typeName === 'Number') {
    switch (parentType) {
      case 'tsNode': {
        switch (propName) {
          case 'flags':
            return expandFlags('NodeFlags', value);
          case 'numericLiteralFlags':
            return expandFlags('TokenFlags', value);
          case 'modifierFlagsCache':
            return expandFlags('ModifierFlags', value);
          case 'scriptKind':
            return `ScriptKind.${tsEnumValue('ScriptKind', value)}`;
          case 'transformFlags':
            return expandFlags('TransformFlags', value);
          case 'kind':
            return `SyntaxKind.${tsEnumValue('SyntaxKind', value)}`;
          case 'languageVersion':
            return `ScriptTarget.${tsEnumValue('ScriptTarget', value)}`;
          case 'languageVariant':
            return `LanguageVariant.${tsEnumValue('LanguageVariant', value)}`;
        }
        break;
      }
      case 'tsSymbol':
        if (propName === 'flags') {
          return expandFlags('SymbolFlags', value);
        }
        break;
      case 'tsFlow':
        if (propName === 'flags') {
          return expandFlags('FlowFlags', value);
        }
        break;
    }
  }
  return undefined;
}

export function getRange(
  typeName: string,
  value: unknown,
  _propName?: string,
  valueType?: ParentNodeType
): [number, number] | undefined {
  if (typeName === 'Object' && Boolean(value) && isRecord(value)) {
    if (
      valueType === 'tsNode' &&
      typeof value.pos === 'number' &&
      typeof value.end === 'number'
    ) {
      return [value.pos, value.end];
    } else if (valueType === 'esNode' && Array.isArray(value.range)) {
      return value.range as [number, number];
    } else if (valueType === 'scope' && isRecord(value.block)) {
      return value.block.range as [number, number];
    }
  }
  return undefined;
}
