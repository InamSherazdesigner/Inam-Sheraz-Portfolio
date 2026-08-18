/**
 * ACCESSIBILITY.
 *
 * Automated scanning catches roughly a third of real WCAG problems, so this is
 * a floor rather than a certificate. The manual checklist that covers the rest
 * is in docs/07-qa.md, and the keyboard journeys are in portfolio.spec.ts.
 *
 * Scanned at AA, which is the level BUILD_SPEC asks for.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Entering a project runs `res-gain`, which holds the whole document at
 * opacity 0.55 for its first frames. Scanning during it measures every colour
 * against a half-transparent version of itself and reports contrast failures
 * that do not exist once the animation settles — which is exactly what an
 * earlier run of this suite did.
 *
 * So: wait for animations to finish, then scan.
 */
async function settle(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => document.getAnimations().every((a) => a.playState !== 'running'),
    undefined,
    { timeout: 5_000 }
  );
}

async function scan(page: import('@playwright/test').Page) {
  await settle(page);
  return new AxeBuilder({ page }).withTags(AA).analyze();
}

test.describe('WCAG AA', () => {
  test('the console', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listbox').waitFor();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('the one-page view', async ({ page }) => {
    await page.goto('/everything');
    await page.waitForLoadState('networkidle');

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('a project page', async ({ page }) => {
    await page.goto('/work/liminal');
    await page.waitForLoadState('networkidle');

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('the full view opened from the console', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listbox').waitFor();
    await page.getByRole('option').first().click();
    await page.getByText('– INFO CARD –').waitFor();
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').waitFor();

    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });

  test('the contact channel, including the form', async ({ page }) => {
    await page.goto('/everything');
    await page.locator('#contact').scrollIntoViewIfNeeded();

    await settle(page);
    const results = await new AxeBuilder({ page }).withTags(AA).include("#contact").analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('reduced motion', () => {
  test('cuts straight through the loading ceremony', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('listbox').waitFor();

    const startedAt = Date.now();
    await page.getByRole('option').first().click();
    await page.getByText('– INFO CARD –').waitFor();

    // The full ceremony is 1400ms. With the preference set it must be
    // effectively instant — BUILD_SPEC §7 says "cuts instantly, with no
    // animation", and this is that promise measured.
    expect(Date.now() - startedAt).toBeLessThan(600);
  });
});
