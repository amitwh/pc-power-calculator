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

test('pick a CPU via the searchable combobox and see it in results', async ({ page }) => {
  await page.goto('/');
  // The catalog has 900+ CPUs and the listbox caps rendered options, so search
  // first — the same way a real user narrows the list.
  await page.getByRole('button', { name: /Select CPU/i }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();
  await expect(page.getByText(/Ryzen 7 7800X3D/i).first()).toBeVisible();
});

test('results show PSU recommendation and overclock slider adjusts peak draw', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Select CPU/i }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();

  const peakText = () =>
    page
      .getByText(/Peak draw \(all components at 100%\):/i)
      .textContent()
      .then((s) => Number(s?.match(/(\d+(?:\.\d+)?)\s*W\s*$/)?.[1]));

  await expect(page.getByText(/Recommended PSU:/i)).toBeVisible();
  const before = await peakText();
  await page.getByLabel(/^CPU OC/i).fill('20');
  await expect
    .poll(peakText, { timeout: 5000 })
    .toBeGreaterThan(before);
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
  await expect(page.getByText(/parts \(2000–2026\)/i)).toBeVisible();

  await page.goto('/#/about');
  await expect(page.getByRole('heading', { name: /About/i }).first()).toBeVisible();
});
