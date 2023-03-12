import type { getTooltipLabel, getTypeName } from './utils';

export interface SelectedPosition {
  line: number;
  column: number;
}

export interface SelectedRange {
  start: SelectedPosition;
  end: SelectedPosition;
}

export type OnSelectNodeFn = (node?: [number, number]) => void;

export type GetTypeNameFN = typeof getTypeName;
export type GetTooltipLabelFn = typeof getTooltipLabel;

export type ParentNodeType =
  | 'esNode'
  | 'scope'
  | 'tsNode'
  | 'tsType'
  | 'tsSymbol'
  | 'tsFlow'
  | undefined;
