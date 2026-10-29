/* Real-browser verification: exercise the new cart UI, export the PDF, and
 * capture desktop + mobile screenshots. Run with the system Chrome channel. */
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const CHANNEL = process.env.PW_CHANNEL || 'chrome';

const browser = await chromium.launch({ channel: CHANNEL });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

await page.goto('http://localhost:4173/');
await page.waitForLoadState('networkidle');

// Add a CPU, a GPU, and 2× the same RAM stick.
const add = async (query, optionRe) => {
  await page.getByRole('button', { name: 'Add device' }).click();
  await page.getByRole('searchbox').fill(query);
  await page.getByRole('option', { name: optionRe }).first().click();
};
await add('7800x3d', /Ryzen 7 7800X3D/);
await add('rtx 4070', /GeForce RTX 4070/);
await add('vengeance 32gb ddr5-5600', /Vengeance 32GB DDR5-5600/);
await page.getByRole('button', { name: 'Increase quantity for Corsair Vengeance 32GB DDR5-5600' }).click();

const qty = await page.getByRole('spinbutton', { name: 'Quantity for Corsair Vengeance 32GB DDR5-5600' }).inputValue();
if (qty !== '2') throw new Error(`expected qty 2, got ${qty}`);

// Move a workload hour so the schedule has real numbers, then screenshot.
await page.getByLabel(/Hours per day for Gaming/i).fill('3').catch(() => {});

await page.screenshot({ path: '/tmp/ui-desktop.png', fullPage: true });

// Mobile viewport screenshot.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto('http://localhost:4173/');
await mobile.waitForLoadState('networkidle');
await mobile.screenshot({ path: '/tmp/ui-mobile.png', fullPage: false });

// Export the PDF and capture the download.
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 30000 }),
  page.getByRole('button', { name: /Export PDF/ }).click(),
]);
const pdfPath = '/tmp/report.pdf';
await download.saveAs(pdfPath);

const buf = fs.readFileSync(pdfPath);
if (buf.subarray(0, 5).toString() !== '%PDF-') throw new Error('download is not a PDF');
console.log(`PDF: ${pdfPath} (${(buf.length / 1024).toFixed(0)} KB)`);
console.log(`filename: ${download.suggestedFilename()}`);

await browser.close();

if (errors.length) {
  console.log('BROWSER ERRORS:');
  for (const e of errors) console.log(' -', e);
  process.exit(2);
}
console.log('no browser errors');
