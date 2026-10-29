import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4173/');
await page.waitForLoadState('networkidle');

// Fill the left column so it's clearly taller than the sidebar.
const add = async (query, optionRe) => {
  await page.getByRole('button', { name: 'Add device' }).click();
  await page.getByRole('searchbox').fill(query);
  await page.getByRole('option', { name: optionRe }).first().click();
};
await add('7800x3d', /Ryzen 7 7800X3D/);
await add('rtx 4070', /GeForce RTX 4070/);
await add('vengeance 32gb ddr5-5600', /Vengeance 32GB DDR5-5600/);

// Scroll deep into the full-width breakdown section.
await page.getByText('Power draw breakdown').scrollIntoViewIfNeeded();
await page.mouse.wheel(0, 300);
await page.waitForTimeout(600);

const boxes = await page.evaluate(() => {
  const get = (sel) => {
    const el = [...document.querySelectorAll('h2, h3, p')].find((x) => sel.test(x.textContent ?? ''));
    return el?.closest('div[class*="rounded-12"]')?.getBoundingClientRect() ?? null;
  };
  return {
    results: get(/Results —/),
    breakdown: get(/Power draw breakdown/),
  };
});
const overlap =
  boxes.results && boxes.breakdown &&
  boxes.results.left < boxes.breakdown.right &&
  boxes.breakdown.left < boxes.results.right &&
  boxes.results.top < boxes.breakdown.bottom &&
  boxes.breakdown.top < boxes.results.bottom;
console.log('results box:', JSON.stringify(boxes.results && { t: Math.round(boxes.results.top), b: Math.round(boxes.results.bottom) }));
console.log('breakdown box:', JSON.stringify(boxes.breakdown && { t: Math.round(boxes.breakdown.top), b: Math.round(boxes.breakdown.bottom) }));
console.log(overlap ? 'FAIL: sticky card overlaps breakdown' : 'OK: no overlap while scrolled');
await page.screenshot({ path: '/tmp/ui-scrolled.png', fullPage: false });
await browser.close();
process.exit(overlap ? 1 : 0);
