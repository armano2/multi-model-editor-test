import type { JSONSchema4 } from 'json-schema';
import json5 from 'json5';

import { isRecord } from '../ast/utils';
import type { EslintRC, TSConfig } from '../playground/types';
import type { ConfigOptionsType } from './ConfigEditor';

export function parseESLintRC(code?: string): EslintRC {
  if (code) {
    try {
      const parsed: unknown = json5.parse(code);
      if (isRecord(parsed)) {
        if ('rules' in parsed && isRecord(parsed.rules)) {
          return parsed as EslintRC;
        }
        return { ...parsed, rules: {} };
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }
  return { rules: {} };
}

export function parseTSConfig(code?: string): TSConfig {
  if (code) {
    try {
      const parsed = window.ts.parseConfigFileTextToJson(
        '/tsconfig.json',
        code
      );
      if (parsed.error) {
        // eslint-disable-next-line no-console
        console.error(parsed.error);
      }
      if (isRecord(parsed.config)) {
        return parsed.config as TSConfig;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }
  return { compilerOptions: {} };
}

export function toJson(cfg: unknown): string {
  return JSON.stringify(cfg, null, 2);
}

export function fromJson(cfg: string): unknown {
  return JSON.parse(cfg);
}

export function schemaToConfigOptions(
  options: Record<string, JSONSchema4>
): ConfigOptionsType[] {
  const result = Object.entries(options).reduce<
    Record<string, ConfigOptionsType>
  >((group, [name, item]) => {
    const category = item.title!;
    group[category] = group[category] ?? {
      heading: category,
      fields: [],
    };
    if (item.type === 'boolean') {
      group[category].fields.push({
        key: name,
        type: 'boolean',
        label: item.description,
      });
    } else if (item.type === 'string' && item.enum) {
      group[category].fields.push({
        key: name,
        type: 'string',
        label: item.description,
        enum: ['', ...(item.enum as string[])],
      });
    } else if (item.oneOf) {
      group[category].fields.push({
        key: name,
        type: 'boolean',
        label: item.description,
        defaults: ['error', 2, 'warn', 1, ['error'], ['warn'], [2], [1]],
      });
    }
    return group;
  }, {});

  return Object.values(result);
}
