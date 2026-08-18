/**
 * The matchers are imported and extended by hand rather than through
 * `@testing-library/jest-dom/vitest`. npm hoists jest-dom to the workspace
 * root but keeps vitest inside each workspace, so that entry point cannot
 * resolve `vitest` from where it sits. Supplying `expect` ourselves removes
 * the resolution entirely.
 */

import * as matchers from '@testing-library/jest-dom/matchers';
import { expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

/**
 * jsdom implements neither of these, and both are reached during a first
 * render: matchMedia by useReducedMotion, scrollIntoView by the image stepper.
 * Without stubs a test throws before it reaches its assertion.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
