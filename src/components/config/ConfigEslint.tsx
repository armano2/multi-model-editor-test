import type { TSESLint } from '@typescript-eslint/utils';
import type { JSONSchema4 } from 'json-schema';
import React, { useCallback, useEffect, useState } from 'react';

import type { EslintRC, PlaygroundSystem } from '../playground/types';
import { shallowEqual } from '../util/shallowEqual';
import type { ConfigOptionsType } from './ConfigEditor';
import ConfigEditor from './ConfigEditor';
import { parseESLintRC, schemaToConfigOptions, toJson } from './utils';

export interface ConfigEslintProps {
  readonly isOpen: boolean;
  readonly onClose: (isOpen: false) => void;
  readonly system: PlaygroundSystem;
}

function checkSeverity(value: unknown): boolean {
  if (typeof value === 'string' || typeof value === 'number') {
    return [0, 1, 2, 'off', 'warn', 'error'].includes(value);
  }
  return false;
}

function checkOptions(
  rule: [string, unknown]
): rule is [string, TSESLint.Linter.RuleEntry] {
  if (Array.isArray(rule[1])) {
    return rule[1].length > 0 && checkSeverity(rule[1][0]);
  }
  return checkSeverity(rule[1]);
}

function readConfigSchema(system: PlaygroundSystem): ConfigOptionsType[] {
  const schemaFile = system.readFile('/schema/eslint.schema');
  if (schemaFile) {
    const schema = JSON.parse(schemaFile) as JSONSchema4;
    if (schema.type === 'object' && schema.properties?.rules?.properties) {
      return schemaToConfigOptions(
        schema.properties.rules.properties
      ).reverse();
    }
  }

  return [];
}

function ConfigEslint({
  isOpen,
  onClose: onCloseProps,
  system,
}: ConfigEslintProps): JSX.Element {
  const [options, updateOptions] = useState<ConfigOptionsType[]>([]);
  const [configObject, updateConfigObject] = useState<EslintRC>();

  useEffect(() => {
    if (isOpen) {
      updateOptions(readConfigSchema(system));
      const config = system.readFile('/.eslintrc');
      updateConfigObject(parseESLintRC(config));
    }
  }, [isOpen, system]);

  const onClose = useCallback(
    (newConfig: Record<string, unknown>) => {
      const cfg = Object.fromEntries(
        Object.entries(newConfig)
          .map<[string, unknown]>(([name, value]) =>
            Array.isArray(value) && value.length === 1
              ? [name, value[0]]
              : [name, value]
          )
          .filter(checkOptions)
      );
      if (!shallowEqual(cfg, configObject?.rules)) {
        system.writeFile(
          '/.eslintrc',
          toJson({ ...(configObject ?? {}), rules: cfg })
        );
      }
      onCloseProps(false);
    },
    [onCloseProps, configObject, system]
  );

  return (
    <ConfigEditor
      header="Eslint Config"
      options={options}
      values={configObject?.rules ?? {}}
      isOpen={isOpen}
      onClose={onClose}
    />
  );
}

export default ConfigEslint;
