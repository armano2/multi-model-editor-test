import type { getTooltipLabel, getTypeName } from './utils';

export type OnHoverNodeFn = (node?: [number, number]) => void;

export type GetTypeNameFN = typeof getTypeName;
export type GetTooltipLabelFn = typeof getTooltipLabel;

export type ParentNodeType =
  | 'esNode'
  | 'tsNode'
  | 'tsType'
  | 'tsSymbol'
  | 'tsFlow'
  | 'scope'
  | 'scopeVariable'
  | 'scopeDefinition'
  | 'scopeReference'
  | undefined;
