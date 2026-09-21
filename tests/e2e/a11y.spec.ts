import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The app uses hash-based routing (#/) so paths must include the hash.
const ROUTES = ['/#/', '/#/compare', '/#/suggestions', '/#/data', '/#/about'];

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