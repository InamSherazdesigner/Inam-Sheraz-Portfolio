/**
 * jest-dom matcher types for Vitest.
 *
 * The library ships this augmentation at `@testing-library/jest-dom/vitest`,
 * but that entry point also imports `vitest` at runtime and cannot resolve it
 * from the hoisted workspace root — see tests/setup.ts. The matchers are
 * therefore extended by hand there, and declared by hand here, so `next build`
 * type-checks the test files instead of failing on unknown matchers.
 */

import 'vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Matchers<T = unknown> extends TestingLibraryMatchers<T, void> {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
