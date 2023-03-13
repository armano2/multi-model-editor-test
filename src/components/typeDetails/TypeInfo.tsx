import React, { useCallback, useMemo } from 'react';
import type * as ts from 'typescript';

import ASTViewer from '../ast/ASTViewer';
import astStyles from '../ast/ASTViewer.module.css';
import type { OnHoverNodeFn } from '../ast/types';
import { isRecord, isTSNode } from '../ast/utils';

export interface TypeInfoProps {
  readonly value: ts.Node;
  readonly program?: ts.Program;
  readonly onHoverNode?: OnHoverNodeFn;
  readonly onSelect: (value: ts.Node) => void;
}

interface InfoModel {
  type?: unknown;
  symbol?: unknown;
  stringType?: unknown;
  contextualType?: unknown;
  signature?: unknown;
  flowNode?: unknown;
}

export function TypeInfo({
  value,
  program,
  onHoverNode,
  onSelect,
}: TypeInfoProps): JSX.Element {
  const computed = useMemo(() => {
    if (!program || !value) {
      return undefined;
    }
    const info: InfoModel = {};
    const typeChecker = program.getTypeChecker();
    try {
      const type = typeChecker.getTypeAtLocation(value);
      info.type = type;
      info.stringType = typeChecker.typeToString(type);
      info.symbol = type.getSymbol();
      let signature = type.getCallSignatures();
      if (signature.length === 0) {
        signature = type.getCallSignatures();
      }
      info.signature = signature.length > 0 ? signature : undefined;
      // @ts-expect-error not part of public api
      info.flowNode = value.flowNode ?? value.endFlowNode ?? undefined;
    } catch (e: unknown) {
      info.type = e;
    }
    try {
      // @ts-expect-error just fail if node type is not correct
      info.contextualType = typeChecker.getContextualType(value);
    } catch (_e: unknown) {
      info.contextualType = undefined;
    }
    return info;
  }, [value, program]);

  const onSelectNode = useCallback(
    (selection: unknown) => {
      if (isRecord(selection) && isTSNode(selection) && value !== selection) {
        onSelect(selection);
        onHoverNode?.(undefined);
      }
    },
    [onSelect, onHoverNode, value]
  );

  if (!program || !computed) {
    return <div>Program not available</div>;
  }

  return (
    <div>
      <>
        <h4 className="padding--sm margin--none">Node</h4>
        <ASTViewer
          onClickNode={onSelectNode}
          onHoverNode={onHoverNode}
          value={value}
        />
        <h4 className="padding--sm margin--none">Type</h4>
        {(computed.type && (
          <ASTViewer onHoverNode={onHoverNode} value={computed.type} />
        )) || <div className={astStyles.list}>None</div>}
        <h4 className="padding--sm margin--none">Type to string</h4>
        {(computed.stringType && (
          <ASTViewer hideCopyButton={true} value={computed.stringType} />
        )) || <div className={astStyles.list}>None</div>}
        <h4 className="padding--sm margin--none">Contextual Type</h4>
        {(computed.contextualType && (
          <ASTViewer
            onHoverNode={onHoverNode}
            value={computed.contextualType}
          />
        )) || <div className={astStyles.list}>None</div>}
        <h4 className="padding--sm margin--none">Symbol</h4>
        {(computed.symbol && (
          <ASTViewer onHoverNode={onHoverNode} value={computed.symbol} />
        )) || <div className={astStyles.list}>None</div>}
        <h4 className="padding--sm margin--none">Signature</h4>
        {(computed.signature && (
          <ASTViewer onHoverNode={onHoverNode} value={computed.signature} />
        )) || <div className={astStyles.list}>None</div>}
        <h4 className="padding--sm margin--none">FlowNode</h4>
        {(computed.flowNode && (
          <ASTViewer onHoverNode={onHoverNode} value={computed.flowNode} />
        )) || <div className={astStyles.list}>None</div>}
      </>
    </div>
  );
}
