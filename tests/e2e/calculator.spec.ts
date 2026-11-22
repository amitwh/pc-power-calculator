import { test, expect } from '@playwright/test';

// The app uses BrowserRouter with real paths (vite preview and nginx both
// fall back to the SPA shell). All e2e specs in this directory rely on that.

test('home page shows the devices picker and results panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('What does your PC cost to run?')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Your system$/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Yearly cost/i }).first()).toBeVisible();
});

test('pick a CPU via the device picker and see it in the list', async ({ page }) => {
  await page.goto('/');
  // The catalog has 1,900+ parts and the listbox caps rendered options, so
  // search first — the same way a real user narrows the list.
  await page.getByRole('button', { name: /add a part/i }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();
  await expect(page.getByText(/Ryzen 7 7800X3D/i).first()).toBeVisible();
});

test('picking the same device twice multiplies its units', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: /add a part/i });
  await add.click();
  await page.getByRole('searchbox').fill('vengeance 32gb ddr5-5600');
  await page.getByRole('option', { name: /Vengeance 32GB DDR5-5600/i }).first().click();
  await add.click();
  await page.getByRole('searchbox').fill('vengeance 32gb ddr5-5600');
  await page.getByRole('option', { name: /Vengeance 32GB DDR5-5600/i }).first().click();
  await expect(
    page.getByRole('group', { name: 'Quantity for Corsair Vengeance 32GB DDR5-5600' }),
  ).toHaveText(/2/);
});

test('single-instance parts (CPU, motherboard) can be removed and swapped', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: /add a part/i });
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

test('results show PSU recommendation and the overclock control adjusts peak draw', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /add a part/i }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();

  await page.getByText(/^Advanced$/).click();

  const peakText = () =>
    page
      .getByText(/^peak \d+(?:\.\d+)? W$/i)
      .textContent()
      .then((s) => Number(s?.match(/peak (\d+(?:\.\d+)?)\s*W/i)?.[1]));

  await expect(page.getByText(/PSU \d+ W/).first()).toBeVisible();
  const before = await peakText();
  await page.getByLabel(/^CPU OC/i).fill('20');
  await expect
    .poll(peakText, { timeout: 5000 })
    .toBeGreaterThan(before);
});

test('the answer recommends a PSU and the CTA opens the picker on PSUs', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: /add a part/i });

  // A CPU and a GPU, and no power supply.
  await add.click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();
  await add.click();
  await page.getByRole('searchbox').fill('rtx 4070');
  await page.getByRole('option', { name: /GeForce RTX 4070/i }).first().click();

  await expect(page.getByText(/no PSU in this build/i).first()).toBeVisible();

  // The CTA opens the parts picker, already filtered to PSUs.
  await page.getByRole('button', { name: /Add a power supply/i }).click();
  await expect(page.getByLabel('Filter parts by category')).toHaveValue('psu');
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option').first()).toContainText('PSU');

  // Picking a PSU from that list adds it, and the recommendation goes away.
  await page.getByRole('searchbox').fill('RM650x (2021)');
  await page.getByRole('option', { name: /RM650x \(2021\)/i }).first().click();
  await expect(page.getByText(/no PSU in this build/i)).toHaveCount(0);

  // Removing it brings the recommendation back.
  await page.getByRole('button', { name: 'Remove Corsair RM650x (2021)' }).click();
  await expect(page.getByText(/no PSU in this build/i).first()).toBeVisible();
});

test('navigate to all routes', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/compare');
  await expect(page.getByRole('heading', { name: /Compare/i }).first()).toBeVisible();

  await page.goto('/suggestions');
  await expect(page.getByRole('heading', { name: /Suggestions/i }).first()).toBeVisible();

  await page.goto('/data');
  await expect(page.getByRole('heading', { name: /Data/i }).first()).toBeVisible();
  await expect(page.getByText(/parts \(2000–2026\)/i)).toBeVisible();

  await page.goto('/about');
  // The visible title is a styled paragraph, not a heading — Layout already
  // renders the route's single (visually hidden) h1, so the page's headings
  // are the section h2s. The hero's eyebrow is what marks the page as
  // rendered.
  await expect(page.getByText('Who we are & how it works')).toBeVisible();
  await expect(page.getByRole('heading', { name: /More from ConcreteInfo/i })).toBeVisible();

  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
  await expect(page.getByText(/Last updated/i)).toBeVisible();

  await page.goto('/guides');
  // The hub's visible title is a styled paragraph, not a heading — Layout
  // already renders the route's single (visually hidden) h1, so the page keeps
  // exactly one h1 and the category sections below it are the h2s. The hero's
  // eyebrow is what marks the page as rendered.
  await expect(page.getByText('PC hardware, explained')).toBeVisible();
  await expect(page.getByRole('link', { name: /How much power does a gaming PC/i })).toBeVisible();

  await page.goto('/help');
  // The user guide follows the same convention: a styled title paragraph in
  // the hero, and the section headings below it as h2s.
  await expect(page.getByText('User guide')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Quick start/i })).toBeVisible();

  await page.goto('/open-source');
  // The directory follows the same convention: a styled title paragraph in
  // the hero, and each project name as an h2 below it.
  await expect(page.getByText('The open-source directory')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'CurveStudio' })).toBeVisible();
  await expect(page.getByText('AGPL-3.0 · Python/TypeScript')).toBeVisible();

  // Deep link renders the article, and links back to the calculator exist.
  await page.goto('/guides/psu-sizing');
  await expect(page.getByRole('heading', { name: /PSU sizing explained/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^calculator$/i }).first()).toBeVisible();
});
