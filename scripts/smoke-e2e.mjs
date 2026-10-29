// Standalone e2e smoke test against the production build (dist/), using the
// system Chrome — for environments where the Playwright CDN is unreachable.
// Usage: node scripts/smoke-e2e.mjs
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'pipe',
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('preview server did not start')), 30000);
  server.stdout.on('data', (d) => {
    if (String(d).includes('Local:')) { clearTimeout(t); resolve(null); }
  });
  server.on('exit', (code) => reject(new Error(`preview exited: ${code}`)));
});

const fail = (msg) => { console.error('SMOKE FAIL:', msg); server.kill(); process.exit(1); };

const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

try {
  // 1. Home boots after the catalog chunk loads.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: /Your Systems/i }).first().waitFor({ timeout: 15000 });
  console.log('OK: app boots and catalog chunk loads');

  // 2. Pick a CPU through the searchable combobox (936 options, capped list).
  await page.getByRole('button', { name: /Select CPU/i }).click();
  await page.getByRole('searchbox').fill('7800x3d');
  await page.getByRole('option', { name: /Ryzen 7 7800X3D/i }).first().click();
  await page.getByText(/AMD Ryzen 7 7800X3D/i).first().waitFor({ timeout: 5000 });
  console.log('OK: CPU selectable via search, card renders');

  // 3. Results + PSU recommendation update.
  await page.getByText(/PSU recommendation/i).waitFor({ timeout: 5000 });
  const reco = await page.getByText(/Recommended PSU:/i).textContent();
  console.log('OK: results panel shows —', reco?.trim().slice(0, 80));

  // 4. Overclock slider raises the peak draw.
  const peakBefore = await page.getByText(/Peak draw \(all components at 100%\):/i).textContent().then((s) => parseFloat(s.match(/(\d+)\s*W\s*$/)?.[1]));
  await page.getByLabel(/^CPU OC/i).fill('20');
  await page.waitForTimeout(300);
  const peakAfter = await page.getByText(/Peak draw \(all components at 100%\):/i).textContent().then((s) => parseFloat(s.match(/(\d+)\s*W\s*$/)?.[1]));
  if (!(peakAfter > peakBefore)) fail(`CPU OC slider did not raise peak draw (${peakBefore} → ${peakAfter})`);
  console.log(`OK: CPU OC 20% raises peak draw ${peakBefore} W → ${peakAfter} W`);

  // 5. Custom device can be added.
  await page.getByLabel('Custom device name').fill('Desk lamp');
  await page.getByLabel('Custom device wattage').fill('10');
  await page.getByRole('button', { name: /Add device/i }).click();
  await page.getByText(/Desk lamp/).first().waitFor({ timeout: 5000 });
  console.log('OK: custom device chip renders');

  // 6. Data freshness page shows catalog stats.
  await page.goto(`${BASE}/#/data`);
  await page.getByText(/parts \(2000–2026\)/i).waitFor({ timeout: 5000 });
  console.log('OK: data page shows catalog counts');

  // 7. Other routes render.
  for (const [path, name] of [['/#/compare', /Compare/i], ['/#/suggestions', /Suggestions/i], ['/#/about', /About/i]]) {
    await page.goto(`${BASE}${path}`);
    await page.getByRole('heading', { name }).first().waitFor({ timeout: 5000 });
  }
  console.log('OK: all routes render');

  if (errors.length) fail(`page errors: ${errors.join(' | ')}`);
  console.log('SMOKE PASS');
} catch (e) {
  fail(e.message);
} finally {
  await browser.close();
  server.kill();
}
