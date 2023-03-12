import type * as Monaco from 'monaco-editor';

import type { LinterResult } from '../../linter/createLinter';
import type { LintCodeAction } from './utils';
import { createEditOperation } from './utils';
import { createURI } from './utils';

export function registerLinter(
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  linter: LinterResult,
  globalActions: Map<string, Map<string, LintCodeAction[]>>
): Monaco.IDisposable {
  const disposable = [
    linter.onLint((fileName, messages, rules): void => {
      const uri = monaco.Uri.file(fileName);
      const model = monaco.editor.getModel(uri);

      if (!model) {
        return;
      }
      const actions = new Map<string, LintCodeAction[]>();

      const markers = messages.map((message) => {
        const fixes: LintCodeAction[] = [];
        const marker: Monaco.editor.IMarkerData = {
          code: message.ruleId
            ? {
                value: message.ruleId,
                target: monaco.Uri.parse(rules.get(message.ruleId)?.url ?? ''),
              }
            : 'FATAL',
          severity:
            message.severity === 2
              ? monaco.MarkerSeverity.Error
              : monaco.MarkerSeverity.Warning,
          source: 'ESLint',
          message: message.message,
          startLineNumber: message.line ?? 1,
          startColumn: message.column ?? 1,
          endLineNumber: message.endLine ?? 1,
          endColumn: message.endColumn ?? 2,
        };

        if (message.fix) {
          fixes.push({
            message: `Fix this ${message.ruleId ?? 'unknown'} problem`,
            isPreferred: true,
            fix: message.fix,
          });
        }
        if (message.suggestions) {
          for (const suggestion of message.suggestions) {
            fixes.push({
              message: suggestion.desc,
              code: message.ruleId,
              isPreferred: false,
              fix: suggestion.fix,
            });
          }
        }
        if (fixes.length > 0) {
          actions.set(createURI(marker), fixes);
        }

        return marker;
      });

      globalActions.set(model.uri.toString(), actions);

      monaco.editor.setModelMarkers(model, 'eslint', markers);
    }),
    monaco.languages.registerCodeActionProvider(
      'typescript',
      {
        provideCodeActions(
          model,
          _range,
          context,
          _token
        ): Monaco.languages.ProviderResult<Monaco.languages.CodeActionList> {
          const fileActions = globalActions.get(model.uri.toString());
          if (!fileActions) {
            return {
              actions: [],
              dispose(): void {
                // noop
              },
            };
          }

          const actions: Monaco.languages.CodeAction[] = [];

          for (const marker of context.markers) {
            const messages = fileActions.get(createURI(marker)) ?? [];
            for (const message of messages) {
              const editOperation = createEditOperation(model, message);
              actions.push({
                title:
                  message.message + (message.code ? ` (${message.code})` : ''),
                diagnostics: [marker],
                kind: 'quickfix',
                isPreferred: message.isPreferred,
                edit: {
                  edits: [
                    {
                      resource: model.uri,
                      // monaco for ts >= 4.8
                      textEdit: editOperation,
                      // @ts-expect-error monaco for ts < 4.8
                      edit: editOperation,
                    },
                  ],
                },
              });
            }
          }

          return {
            actions,
            dispose(): void {
              // noop
            },
          };
        },
      },
      {
        providedCodeActionKinds: ['quickfix'],
      }
    ),
  ];

  return {
    dispose(): void {
      disposable.forEach((item) => item.dispose());
    },
  };
}
