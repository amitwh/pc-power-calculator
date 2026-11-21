import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The app uses BrowserRouter with real paths (nginx + vite preview serve the
// SPA shell for unknown paths). Guides articles share the Guides component.
//
// The guide routes are a sample, not the whole set: one article per figure
// family (inline SVG needs a role and a label) plus the longest one, so a
// regression in the figure markup or the article typography is caught without
// turning this into a 26-route sweep.
const ROUTES = [
  '/',
  '/compare',
  '/suggestions',
  '/suggest',
  '/feedback',
  '/data',
  '/about',
  '/privacy',
  '/guides',
  '/guides/psu-sizing',
  '/guides/how-a-pc-works',
  '/guides/cpu-explained',
  '/guides/cpu-caches',
  '/guides/gpu-explained',
  '/guides/storage-explained',
  '/guides/pcie-and-m2',
  '/guides/hardware-glossary',
];

for (const path of ROUTES) {
  test(`a11y ${path} has no violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for the route to render before scanning — otherwise axe can miss
    // a heading that hasn't been mounted yet on slower runners.
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}