/**
 * eslint-config-next 16 ships native flat configs, so they are composed
 * directly rather than through FlatCompat — the compat shim cannot serialise
 * the plugin graph these export and throws on a circular structure.
 */

import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescriptConfig from 'eslint-config-next/typescript';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      /**
       * The artwork is pre-compressed .webp served from /public and goes
       * through next/image. The one raw <img> in the build is the 1-bit LCD
       * sprite, which must not be resampled — image-rendering: pixelated
       * depends on the source being untouched. That single case carries its
       * own inline disable, so this stays a warning rather than an error.
       */
      '@next/next/no-img-element': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
