import { expect, test } from '@playwright/test';

/**
 * nginx answers unknown URLs with dist/index.html and HTTP 200, so there is no
 * server-side 404. These tests pin what the client does instead: render a real
 * page (not the blank screen an unmatched <Routes> produced) and mark it
 * noindex so it cannot be indexed as a duplicate of the home page.
 */

async function robotsContent(page: import('@playwright/test').Page) {
  return page.evaluate(
    () => document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content ?? null,
  );
}

test('an unknown path renders the not-found page and is noindexed', async ({ page }) => {
  await page.goto('/not-a-real-page');

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(await robotsContent(page)).toContain('noindex');
  expect(await page.locator('link[rel="canonical"]').count()).toBe(0);
});

test('an unknown part id is noindexed too', async ({ page }) => {
  await page.goto('/parts/not-a-real-part');

  await expect(page.getByRole('heading', { name: 'Part not found' })).toBeVisible();
  expect(await robotsContent(page)).toContain('noindex');
});

test('a real part page keeps its canonical and is indexable', async ({ page }) => {
  await page.goto('/parts/gpu-amd-rx-6400');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://pcpower.concreteinfo.co.in/parts/gpu-amd-rx-6400',
  );
  expect(await robotsContent(page)).toBeNull();
});
