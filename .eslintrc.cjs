module.exports = {
  root: true,
  plugins: [
    '@typescript-eslint',
    'simple-import-sort',
    'jsx-a11y',
    'react',
    'react-hooks',
  ],
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:jsx-a11y/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    sourceType: 'module',
    project: ['./tsconfig.web.json', './tsconfig.node.json'],
  },
  rules: {
    //
    // our plugin :D
    //
    '@typescript-eslint/no-duplicate-imports': 'error',

    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': true,
        'ts-nocheck': true,
        'ts-check': false,
        minimumDescriptionLength: 5,
      },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: true },
    ],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['arrowFunctions'] },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      {
        allowNumber: true,
        allowBoolean: true,
        allowAny: true,
        allowNullish: true,
        allowRegExp: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { varsIgnorePattern: '^_', argsIgnorePattern: '^_' },
    ],

    //
    // eslint-base
    //

    curly: ['error', 'all'],
    eqeqeq: [
      'error',
      'always',
      {
        null: 'never',
      },
    ],
    'no-mixed-operators': 'error',
    'no-console': 'error',
    'no-process-exit': 'error',
    'no-fallthrough': [
      'warn',
      { commentPattern: '.*intentional fallthrough.*' },
    ],

    // enforce a sort order across the codebase
    'simple-import-sort/imports': 'error',
  },
  overrides: [
    {
      plugins: ['jsx-a11y', 'react', 'react-hooks'],
      files: ['./src/**/*.ts', './src/**/*.tsx'],
      rules: {
        // react
        'react/jsx-no-target-blank': 'off',
        'react/no-unescaped-entities': 'off',
        '@typescript-eslint/internal/prefer-ast-types-enum': 'off',
        'react/jsx-curly-brace-presence': 'error',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
