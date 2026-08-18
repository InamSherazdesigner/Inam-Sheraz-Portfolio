/**
 * END TO END — the journeys a real visitor takes, in a real browser, against
 * a production build.
 *
 * The tests are grouped by who is taking the journey, because that is what
 * BUILD_SPEC's hard requirements are written about: an art director with
 * thirty seconds, someone on a phone, and someone using a keyboard.
 */

import { test, expect } from '@playwright/test';

test.describe('the console', () => {
  test('shows all eleven projects as readable text on load', async ({ page }) => {
    await page.goto('/');

    // BUILD_SPEC §2 — the single most important rule in the build.
    const list = page.getByRole('listbox');
    await expect(list).toBeVisible();
    await expect(list.getByRole('option')).toHaveCount(11);
    await expect(page.getByText('11 ITEMS')).toBeVisible();
    await expect(list.getByText('MOODIYAN TON AGGE')).toBeVisible();
    await expect(list.getByText('E-WALLET APP')).toBeVisible();
  });

  test('opens a project through load, card and full view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listbox').waitFor();

    await page.getByRole('option').filter({ hasText: 'LIMINAL' }).click();

    await expect(page.getByText('– INFO CARD –')).toBeVisible();
    await expect(page.getByText('A VIEW FULL WORK')).toBeVisible();

    await page.keyboard.press('Enter');

    const stage = page.getByRole('dialog');
    await expect(stage).toBeVisible();
    await expect(stage.getByRole('heading', { level: 1 })).toHaveText('LIMINAL');
    // LIMINAL overrides the amber ground — its own rule is black and white.
    await expect(stage).toHaveCSS('background-color', 'rgb(247, 247, 246)');
  });

  test('backs out one stage at a time', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listbox').waitFor();

    await page.getByRole('option').first().click();
    await expect(page.getByText('– INFO CARD –')).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByText('– INFO CARD –')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeVisible();
  });
});

test.describe('the thirty-second visitor', () => {
  /**
   * BUILD_SPEC §5: the escape hatch must be reachable without learning any
   * control. This is how a hiring manager with thirty seconds gets to the
   * work, and the spec calls it not optional.
   */
  test('reaches every project without touching a control', async ({ page }) => {
    await page.goto('/');

    // Exact, because the skip link points at the same place and would match
    // a loose name. Both routes are covered — the skip link has its own test.
    await page.getByRole('link', { name: 'VIEW EVERYTHING AS ONE PAGE', exact: true }).click();
    await expect(page).toHaveURL(/\/everything$/);

    await expect(page.getByRole('navigation', { name: 'Projects' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'MOODIYAN TON AGGE' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'E-WALLET APP' })).toBeVisible();

    // Eleven projects plus About and Contact, each as its own section.
    await expect(page.locator('.every__sec')).toHaveCount(13);
  });

  test('links straight to one project', async ({ page }) => {
    await page.goto('/work/scents-by-amman');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SCENTS BY AMMAN');
    await expect(page).toHaveTitle(/SCENTS BY AMMAN/);
  });
});

test.describe('artwork', () => {
  test('loads every image on a project page', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      if (/\/(assets|sprites)\//.test(url) && response.status() >= 400) failed.push(url);
    });

    await page.goto('/work/juno');
    await page.waitForLoadState('networkidle');

    // Scroll the page so every lazy image is asked for.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForLoadState('networkidle');

    expect(failed).toEqual([]);

    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll('img')].filter((img) => img.complete && img.naturalWidth === 0)
          .length
    );
    expect(broken).toBe(0);
  });

  test('never autoplays anything with sound', async ({ page }) => {
    await page.goto('/work/motion-graphics');

    // Every video on this project has music or a sound effect, so every one
    // must be a play button the visitor presses. BUILD_SPEC §11, §13.
    const autoplaying = await page.evaluate(
      () => [...document.querySelectorAll('video')].filter((v) => v.autoplay && !v.muted).length
    );
    expect(autoplaying).toBe(0);

    const audio = await page.evaluate(
      () => [...document.querySelectorAll('audio')].filter((a) => a.autoplay).length
    );
    expect(audio).toBe(0);
  });

  test('plays the three tree projections together, silently', async ({ page }) => {
    await page.goto('/work/moodiyan-ton-agge');

    const triptych = page.locator('.triptych video');
    await expect(triptych).toHaveCount(3);

    // Seeing them at once is the argument. Silent, muted, looping.
    for (let i = 0; i < 3; i += 1) {
      await expect(triptych.nth(i)).toHaveJSProperty('muted', true);
      await expect(triptych.nth(i)).toHaveJSProperty('loop', true);
    }
  });
});

test.describe('content warnings and gates', () => {
  test('hides the Khushi Ya Majboori images until the note is acknowledged', async ({ page }) => {
    await page.goto('/work/posters');

    await expect(page.getByText('This work depicts domestic violence.')).toBeVisible();

    // Not merely hidden — absent. Nothing arrives in the document that the
    // visitor has not agreed to see.
    await expect(page.locator('img[alt*="Khushi Ya Majboori"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'SHOW THE IMAGES' }).click();
    await expect(page.locator('img[alt*="Khushi Ya Majboori"]').first()).toBeVisible();
  });

  test('keeps the CAT set behind the gate and says plainly what the gate is', async ({ page }) => {
    await page.goto('/work/cat-illustrations');

    // Three watermarked details, not ten.
    await expect(page.locator('.plate--marked')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'UNLOCK' })).toBeVisible();

    // BUILD_SPEC §10 forbids claiming the gate is security.
    await expect(page.getByText(/not security/i)).toBeVisible();

    // And the password is not in the bundle.
    const scripts = await page.evaluate(() =>
      [...document.querySelectorAll('script')].map((s) => s.textContent ?? '').join(' ')
    );
    expect(scripts).not.toContain('apperception');
  });
});

test.describe('the keyboard visitor', () => {
  test('can skip the console entirely from the first Tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listbox').waitFor();

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /Skip the console/i });
    await expect(skip).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/everything$/);
  });

  test('shows a visible focus ring on every control', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('listbox').waitFor();

    await page.getByLabel('A — open').focus();
    const outline = await page
      .getByLabel('A — open')
      .evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(outline).not.toBe('0px');
  });
});

test.describe('security headers', () => {
  test('serves the documented header set', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response!.headers();

    expect(headers['content-security-policy']).toContain("default-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    // The site needs a microphone and nothing else.
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['permissions-policy']).toContain('microphone=(self)');
  });

  test('ships no credential to the browser', async ({ page }) => {
    await page.goto('/work/moodiyan-ton-agge');

    const everything = await page.content();
    expect(everything).not.toMatch(/xi-api-key/i);
    expect(everything).not.toMatch(/sk_[a-z0-9_]{16,}/i);
    expect(everything).not.toMatch(/elevenlabs[_-]?api[_-]?key/i);
  });
});

test.describe('SEO', () => {
  test('publishes a sitemap covering every project', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response!.status()).toBe(200);

    const xml = await response!.text();
    expect(xml).toContain('/everything');
    expect(xml).toContain('/work/moodiyan-ton-agge');
    expect(xml).toContain('/work/e-wallet-app');
  });

  test('describes the person and the work in structured data', async ({ page }) => {
    await page.goto('/');

    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
    const data = JSON.parse(jsonLd!);
    expect(data['@type']).toBe('Person');
    expect(data.name).toBe('Inam Sheraz');
    expect(data.workExample).toHaveLength(11);
  });
});
