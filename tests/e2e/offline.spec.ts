import { expect, test, type Page } from '@playwright/test';

/**
 * The prerender writes 366 pages after Workbox has already generated sw.js, so
 * the SW cannot precache them. These tests pin the two behaviours that replace
 * that: an offline deep link gets the app shell (`offline.html`) rather than
 * the home page's prerendered markup, and pages the visitor actually opened are
 * served from the navigation runtime cache.
 */

const HYDRATION_ERROR = /hydrat|did not match|server rendered|Minified React error #4(18|19|21|22|23)/i;

/** Wait until the service worker is installed and controlling the page. */
async function awaitServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => navigator.serviceWorker.controller !== null))) {
    await page.reload();
  }
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), {
      timeout: 20_000,
    })
    .toBe(true);
}

test.describe('offline', () => {
  test.setTimeout(45_000);

  test('an unvisited route offline renders the app instead of the home page', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await awaitServiceWorkerControl(page);

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await context.setOffline(true);
    try {
      await page.goto('/guides/cutting-pc-power');
      // The shell is prerendered with an empty #root, so this heading exists
      // only if the client rendered the right route.
      await expect(
        page.getByRole('heading', { level: 1, name: /frame caps|what actually cuts/i }),
      ).toBeVisible();
      expect(errors.filter((e) => HYDRATION_ERROR.test(e))).toEqual([]);
    } finally {
      await context.setOffline(false);
    }
  });

  test('a page visited earlier is served offline from the navigation cache', async ({
    page,
    context,
  }) => {
    await page.goto('/guides/psu-sizing');
    await expect(page.getByRole('heading', { level: 1, name: /psu sizing/i })).toBeVisible();
    await awaitServiceWorkerControl(page);
    // Let the NetworkFirst route populate its cache before going offline.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /psu sizing/i })).toBeVisible();

    await context.setOffline(true);
    try {
      await page.goto('/guides/psu-sizing');
      await expect(page.getByRole('heading', { level: 1, name: /psu sizing/i })).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});
