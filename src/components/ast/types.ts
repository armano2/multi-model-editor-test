import type { getTooltipLabel, getTypeName } from './utils';

export type OnSelectNodeFn = (node?: [number, number]) => void;

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
