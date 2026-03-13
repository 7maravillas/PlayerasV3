import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prisma from 'eslint-plugin-prisma';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.js'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      globals: { ...globals.node, ...globals.es2021 }
    },
    plugins: { '@typescript-eslint': tsPlugin, prisma },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...prisma.configs.recommended.rules,
      'prisma/require-select': 'off', // evita exigir type-info ahora
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name='prisma'][property.name='$queryRawUnsafe']",
          message:
            'Usa prisma.$queryRaw con template tag; $queryRawUnsafe está prohibido.'
        },
        {
          selector: "CallExpression[callee.property.name='$queryRawUnsafe']",
          message:
            'Usa prisma.$queryRaw con template tag; $queryRawUnsafe está prohibido.'
        }
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'max-len': ['warn', { code: 120 }],
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  { files: ['prisma/seed.ts', 'src/server.ts'], rules: { 'no-console': 'off' } }
];
