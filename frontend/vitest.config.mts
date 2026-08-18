/**
 * `.mts` rather than `.ts`: this package has no `"type": "module"`, so a
 * `.ts` config is loaded as CommonJS and its ESM syntax warns on every run.
 *
 * No React plugin. Vitest transforms TSX itself and reads `jsx: react-jsx`
 * from tsconfig; the plugin exists for Fast Refresh, which a test run has no
 * use for, and it currently emits deprecation warnings against this Vite.
 */

import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Playwright owns tests/e2e. Vitest picking those up would try to run
    // Playwright's runner inside jsdom and fail confusingly.
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/**', 'src/content/**'],
    },
  },
});
