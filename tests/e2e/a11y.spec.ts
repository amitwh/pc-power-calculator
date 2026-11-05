import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The app uses BrowserRouter with real paths (nginx + vite preview serve the
// SPA shell for unknown paths). Guides articles share the Guides component.
const ROUTES = ['/', '/compare', '/suggestions', '/data', '/about', '/privacy', '/guides', '/guides/psu-sizing'];

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