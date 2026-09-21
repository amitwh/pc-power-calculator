import { test, expect } from '@playwright/test';

// The app uses hash-based routing (#/), so `page.goto('/')` lands on the Home
// route. All e2e specs in this directory rely on the same convention.

test('home page shows the build picker and results panel', async ({ page }) => {
  await page.goto('/');
  // The "Your Systems" heading is rendered as both the picker title (h2) and
  // the "All your systems at a glance" summary card (h3) — anchor on the h2.
  await expect(page.getByRole('heading', { name: /Your Systems/i }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Results/i }).first()).toBeVisible();
});

test('pick a CPU and see the component reflected in results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/Select CPU/i).selectOption('cpu-amd-ryzen-7-7800x3d');
  // The selected model also appears as the <option> label of the <select>,
  // which is closed/hidden. The visible ComponentCard renders the same text
  // in a <span>, which is the second text node containing the model.
  const matches = page.getByText(/Ryzen 7 7800X3D/i);
  await expect(matches.nth(1)).toBeVisible();
});

test('navigate to all five routes', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$|#\/$/);

  await page.goto('/#/compare');
  await expect(page.getByRole('heading', { name: /Compare/i }).first()).toBeVisible();

  await page.goto('/#/suggestions');
  await expect(page.getByRole('heading', { name: /Suggestions/i }).first()).toBeVisible();

  await page.goto('/#/data');
  await expect(page.getByRole('heading', { name: /Data/i }).first()).toBeVisible();

  await page.goto('/#/about');
  await expect(page.getByRole('heading', { name: /About/i }).first()).toBeVisible();
});