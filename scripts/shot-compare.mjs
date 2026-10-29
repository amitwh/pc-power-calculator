import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto('http://localhost:4173/');
await page.waitForLoadState('networkidle');

// Build A: gaming rig (default build), add CPU + GPU.
const add = async (query, optionRe) => {
  await page.getByRole('button', { name: 'Add device' }).click();
  await page.getByRole('searchbox').fill(query);
  await page.getByRole('option', { name: optionRe }).first().click();
};
await add('7800x3d', /Ryzen 7 7800X3D/);
await add('rtx 4070', /GeForce RTX 4070/);

// Build B: office PC, US location so the compare exercises FX conversion.
await page.getByRole('button', { name: '+ Add system' }).click();
await page.getByLabel('System type').selectOption('workstation');
await add('i3-12100', /Core i3-12100/);
await page.getByLabel('Country').selectOption('US');

await page.goto('http://localhost:4173/#/compare');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/ui-compare.png', fullPage: true });
console.log('compare screenshot saved');
await browser.close();
