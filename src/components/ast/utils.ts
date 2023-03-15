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

export function getNodeType(typeName: string, value: unknown): ParentNodeType {
  if (typeName === 'Object' && Boolean(value) && isRecord(value)) {
    if (isESNode(value)) {
      return 'esNode';
    } else if ('$id' in value && 'childScopes' in value && 'type' in value) {
      return 'scope';
    } else if (
      'scopes' in value &&
      'nodeToScope' in value &&
      'declaredVariables' in value
    ) {
      return 'scopeManager';
    } else if (
      'references' in value &&
      'identifiers' in value &&
      'name' in value
    ) {
      return 'scopeVariable';
    } else if ('$id' in value && 'type' in value && 'node' in value) {
      return 'scopeDefinition';
    } else if (
      '$id' in value &&
      'resolved' in value &&
      'identifier' in value &&
      'from' in value
    ) {
      return 'scopeReference';
    } else if ('kind' in value && 'pos' in value && 'flags' in value) {
      return 'tsNode';
    } else if ('getSymbol' in value) {
      return 'tsType';
    } else if ('getDeclarations' in value && value.getDeclarations != null) {
      return 'tsSymbol';
    } else if ('getParameters' in value && value.getParameters != null) {
      return 'tsSignature';
    } else if (
      'flags' in value &&
      ('antecedent' in value || 'antecedents' in value || 'consequent' in value)
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
    switch (valueType) {
      case 'esNode':
        return String(value.type);
      case 'tsNode':
        return tsEnumValue('SyntaxKind', value.kind);
      case 'scopeManager':
        return 'ScopeManager';
      case 'scope':
        return `${ucFirst(String(value.type))}Scope$${String(value.$id)}`;
      case 'scopeDefinition':
        return `Definition#${String(value.type)}$${String(value.$id)}`;
      case 'scopeVariable':
        return `Variable#${String(value.name)}$${String(value.$id)}`;
      case 'scopeReference':
        return `Reference#${String(
          isRecord(value.identifier) ? value.identifier.name : 'unknown'
        )}$${String(value.$id)}`;
      case 'tsType':
        return '[Type]';
      case 'tsSymbol':
        return `Symbol(${String(value.escapedName)})`;
      case 'tsSignature':
        return '[Signature]';
      case 'tsFlow':
        return '[FlowNode]';
    }
  } else if (typeName !== 'Array') {
    return typeName;
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
      case 'tsType':
        if (propName === 'flags') {
          return expandFlags('TypeFlags', value);
        } else if (propName === 'objectFlags') {
          return expandFlags('ObjectFlags', value);
        }
        break;
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

function getValidRange(range: unknown): [number, number] | undefined {
  if (
    Array.isArray(range) &&
    typeof range[0] === 'number' &&
    typeof range[1] === 'number'
  ) {
    return range as [number, number];
  }
  return undefined;
}

export function getRange(
  value: unknown,
  valueType?: ParentNodeType
): [number, number] | undefined {
  if (Boolean(value) && isRecord(value)) {
    switch (valueType) {
      case 'esNode':
        return getValidRange(value.range);
      case 'tsNode':
        return getValidRange([value.pos, value.end]);
      case 'scope':
        if (isRecord(value.block)) {
          return getValidRange(value.block.range);
        }
        break;
      case 'scopeVariable':
        if (
          Array.isArray(value.identifiers) &&
          value.identifiers.length > 0 &&
          isRecord(value.identifiers[0])
        ) {
          return getValidRange(value.identifiers[0].range);
        }
        break;
      case 'scopeDefinition':
        if (isRecord(value.node)) {
          return getValidRange(value.node.range);
        }
        break;
      case 'scopeReference':
        if (isRecord(value.identifier)) {
          return getValidRange(value.identifier.range);
        }
        break;
    }
  }
  return undefined;
}

export function filterProperties(
  key: string,
  value: unknown,
  type: ParentNodeType
): boolean {
  if (
    value === undefined ||
    typeof value === 'function' ||
    key.startsWith('_')
  ) {
    return false;
  }

  switch (type) {
    case 'esNode':
      return key !== 'tokens' && key !== 'comments';
    case 'scopeManager':
      return (
        key !== 'declaredVariables' &&
        key !== 'nodeToScope' &&
        key !== 'currentScope'
      );
    case 'tsNode':
      return (
        key !== 'nextContainer' &&
        key !== 'parseDiagnostics' &&
        key !== 'bindDiagnostics' &&
        key !== 'lineMap' &&
        key !== 'flowNode' &&
        key !== 'endFlowNode' &&
        key !== 'jsDocCache' &&
        key !== 'jsDoc' &&
        key !== 'symbol'
      );
    case 'tsType':
      return (
        key !== 'checker' &&
        key !== 'constructSignatures' &&
        key !== 'callSignatures'
      );
    case 'tsSignature':
      return key !== 'checker';
  }

  return true;
}
