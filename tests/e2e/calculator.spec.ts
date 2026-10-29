import { test, expect } from '@playwright/test';

// The app uses hash-based routing (#/), so `page.goto('/')` lands on the Home
// route. All e2e specs in this directory rely on the same convention.

test('home page shows the devices picker and results panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your Systems/i }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Results/i }).first()).toBeVisible();
});

test('pick a CPU via the device picker and see it in the list', async ({ page }) => {
  await page.goto('/');
  // The catalog has 1,900+ parts and the listbox caps rendered options, so
  // search first — the same way a real user narrows the list.
  await page.getByRole('button', { name: 'Add device' }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();
  await expect(page.getByText(/Ryzen 7 7800X3D/i).first()).toBeVisible();
});

test('picking the same device twice multiplies its units', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add device' });
  await add.click();
  await page.getByRole('searchbox').fill('vengeance 32gb ddr5-5600');
  await page.getByRole('option', { name: /Vengeance 32GB DDR5-5600/i }).first().click();
  await add.click();
  await page.getByRole('searchbox').fill('vengeance 32gb ddr5-5600');
  await page.getByRole('option', { name: /Vengeance 32GB DDR5-5600/i }).first().click();
  await expect(
    page.getByRole('spinbutton', { name: 'Quantity for Corsair Vengeance 32GB DDR5-5600' }),
  ).toHaveValue('2');
});

test('single-instance parts (CPU, motherboard) can be removed and swapped', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add device' });
  await add.click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();

  // Remove via the row's × — single-slot parts must not get stuck.
  await page.getByRole('button', { name: 'Remove AMD Ryzen 7 7800X3D' }).click();
  await expect(page.getByText(/Ryzen 7 7800X3D/i)).toHaveCount(0);

  // Add a motherboard, then swap it for a different one.
  await add.click();
  await page.getByRole('searchbox').fill('b550m pro4');
  await page.getByRole('option', { name: /B550M Pro4/i }).first().click();
  await add.click();
  await page.getByRole('searchbox').fill('b650m pg riptide');
  await page.getByRole('option', { name: /B650M PG Riptide/i }).first().click();
  await expect(page.getByText(/B650M PG Riptide/i).first()).toBeVisible();
  await expect(page.getByText(/B550M Pro4/i)).toHaveCount(0);
});

test('results show PSU recommendation and overclock slider adjusts peak draw', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add device' }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();

  await page.getByText('Overclocking & chassis fans').click();

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
