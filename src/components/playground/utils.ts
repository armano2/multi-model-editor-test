import type { ErrorGroup, LintCodeAction } from './types';
import type Monaco from 'monaco-editor';

export function createEditOperation(
  model: Monaco.editor.ITextModel,
  action: LintCodeAction
): { range: Monaco.IRange; text: string } {
  const start = model.getPositionAt(action.fix.range[0]);
  const end = model.getPositionAt(action.fix.range[1]);
  return {
    text: action.fix.text,
    range: {
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    },
  };
}

function normalizeCode(code: Monaco.editor.IMarker['code']): {
  value: string;
  target?: string;
} {
  if (!code) {
    return { value: '' };
  }
  if (typeof code === 'string') {
    return { value: code };
  }
  return {
    value: code.value,
    target: code.target.toString(),
  };
}

export function createURI(marker: Monaco.editor.IMarkerData): string {
  return `[${[
    marker.startLineNumber,
    marker.startColumn,
    marker.startColumn,
    marker.endLineNumber,
    marker.endColumn,
    (typeof marker.code === 'string' ? marker.code : marker.code?.value) ?? '',
  ].join('|')}]`;
}

export function parseMarkers(
  markers: Monaco.editor.IMarker[]
  // fixes: Map<string, LintCodeAction[]>,
  // editor: Monaco.editor.IStandaloneCodeEditor
): ErrorGroup[] {
  const result: Record<string, ErrorGroup> = {};
  for (const marker of markers) {
    const code = normalizeCode(marker.code);
    // const uri = createURI(marker);
    // const fixers =
    //   fixes.get(uri)?.map((item) => ({
    //     message: item.message,
    //     isPreferred: item.isPreferred,
    //     fix(): void {
    //       editor.executeEdits('eslint', [
    //         createEditOperation(editor.getModel()!, item),
    //       ]);
    //     },
    //   })) ?? [];

    const group =
      marker.owner === 'eslint'
        ? code.value
        : marker.owner === 'typescript'
        ? 'TypeScript'
        : marker.owner;

    if (!result[group]) {
      result[group] = {
        group: group,
        uri: code.target,
        items: [],
      };
    }

    result[group].items.push({
      message:
        (marker.owner !== 'eslint' && code ? `${code.value}: ` : '') +
        marker.message,
      location: `${marker.startLineNumber}:${marker.startColumn} - ${marker.endLineNumber}:${marker.endColumn}`,
      severity: marker.severity,
      // fixer: fixers.find((item) => item.isPreferred),
      suggestions: [], // fixers.filter((item) => !item.isPreferred),
    });
  }

  return Object.values(result).sort((a, b) => a.group.localeCompare(b.group));
}
