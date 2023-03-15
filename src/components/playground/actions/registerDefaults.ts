import type { JSONSchema4 } from 'json-schema';
import type * as Monaco from 'monaco-editor';

import type { LinterResult } from '../../linter/createLinter';
import type { PlaygroundSystem } from '../types';

export function getEslintSchema(linter: LinterResult): JSONSchema4 {
  const properties: Record<string, JSONSchema4> = {};

  for (const [, item] of linter.rules) {
    properties[item.name] = {
      description: item.description,
      title: item.name.startsWith('@typescript') ? 'Rules' : 'Core rules',
      default: 'off',
      oneOf: [
        {
          type: ['string', 'number'],
          enum: ['off', 'warn', 'error', 0, 1, 2],
        },
        {
          type: 'array',
          items: [
            {
              type: ['string', 'number'],
              enum: ['off', 'warn', 'error', 0, 1, 2],
            },
          ],
        },
      ],
    };
  }

  return {
    type: 'object',
    properties: {
      extends: {
        type: 'array',
        items: {
          type: 'string',
          enum: linter.presets,
        },
      },
      rules: {
        type: 'object',
        properties: properties,
        additionalProperties: false,
      },
    },
  };
}

const allowedCategories = [
  'Command-line Options',
  'Projects',
  'Compiler Diagnostics',
  'Editor Support',
  'Output Formatting',
  'Watch and Build Modes',
  'Source Map Options',
];

export function getTsConfigSchema(): JSONSchema4 {
  const properties = window.ts.optionDeclarations.reduce<
    Record<string, JSONSchema4>
  >((options, item) => {
    if (
      item.description &&
      item.category &&
      !allowedCategories.includes(item.category.message) &&
      !item.isCommandLineOnly
    ) {
      if (item.type === 'boolean') {
        options[item.name] = {
          type: 'boolean',
          description: item.description.message,
          title: item.category.message,
        };
      } else if (item.type === 'list' && item.element?.type instanceof Map) {
        options[item.name] = {
          type: 'array',
          items: {
            type: 'string',
            enum: Array.from(item.element.type.keys()),
          },
          description: item.description.message,
          title: item.category.message,
        };
      } else if (item.type instanceof Map) {
        options[item.name] = {
          type: 'string',
          description: item.description.message,
          enum: Array.from(item.type.keys()),
          title: item.category.message,
        };
      }
    }
    return options;
  }, {});

  return {
    type: 'object',
    properties: {
      compilerOptions: {
        type: 'object',
        properties: properties,
      },
    },
  };
}

export function registerDefaults(
  monaco: typeof Monaco,
  linter: LinterResult,
  system: PlaygroundSystem
): void {
  const eslintSchema = getEslintSchema(linter);
  system.writeFile('/schema/eslint.schema', JSON.stringify(eslintSchema));
  const tsconfigSchema = getTsConfigSchema();
  system.writeFile('/schema/tsconfig.schema', JSON.stringify(tsconfigSchema));

  // configure the JSON language support with schemas and schema associations
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      {
        uri: monaco.Uri.file('/schema/eslint.schema').toString(),
        fileMatch: ['.eslintrc'],
        schema: eslintSchema,
      },
      {
        uri: monaco.Uri.file('/schema/tsconfig.schema').toString(),
        fileMatch: ['tsconfig.json'],
        schema: tsconfigSchema,
      },
    ],
  });
}
