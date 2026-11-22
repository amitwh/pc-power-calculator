import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * End-to-end proof that the app's HTML button hands the reader a real file:
 * a browser download, opened and read back off disk.
 *
 * Two things are being proven here. The first is that the download starts at
 * all — the blob URL used to be revoked in the same tick as the click, which
 * could pull the file out from under a download that had not begun, and it
 * failed silently: no error, no file, nothing to report. The second is that
 * the report names the host it was served from, which is the whole point of
 * the shared `SITE` constant — a report that points somewhere else is a
 * broken link in the one document a reader is likely to keep or forward.
 */

const STORAGE_KEY = 'pc-power-builds';
const GEO_FLAG = 'pc-power-geo-detected';
const SITE = 'https://pcpower.concreteinfo.net';
const SITE_HOST = 'pcpower.concreteinfo.net';

const SEEDED_BUILD = {
  id: 'b1',
  name: 'Gaming build',
  category: 'gaming',
  components: {
    cpu: 'cpu-amd-ryzen-7-7800x3d',
    gpu: 'gpu-amd-rx-7800xt',
    ram: ['ram-corsair-vengeance-32gb-ddr5-6000'],
    storage: ['storage-crucial-t700-2tb'],
    motherboard: 'mb-asrock-b650e-pg-riptide-wifi',
    psu: 'psu-bequiet-system-power-10-650w',
    monitors: ['monitor-alienware-aw3423dwf'],
  },
  quantities: { 'ram-corsair-vengeance-32gb-ddr5-6000': 2 },
  tdpOverrides: {},
  overclock: { cpu_pct: 0, gpu_pct: 0 },
  case_fans: 2,
  idle_hours_per_day: 2,
  schedule: [
    { workload_id: 'gaming_1080p', hours_per_day: 4, days_per_week: 7 },
    { workload_id: 'office', hours_per_day: 8, days_per_week: 7 },
    { workload_id: 'browser', hours_per_day: 4, days_per_week: 7 },
  ],
  location: { country_iso2: 'IN', subdivision_code: 'MH' },
  measured: { idle_w: 90, load_w: 520, avg_w: 130 },
};

test('exports an HTML report that names the host it came from', async ({ page }) => {
  test.setTimeout(60_000);

  await page.addInitScript(
    ({ key, geoFlag, build }) => {
      // Pin the tariff: auto-detection must not rewrite the seeded location
      // from the runner's own IP.
      localStorage.setItem(geoFlag, '1');
      localStorage.setItem(
        key,
        JSON.stringify({
          state: { builds: [build], activeBuildId: 'b1', customPeripherals: [] },
          version: 1,
        }),
      );
    },
    { key: STORAGE_KEY, geoFlag: GEO_FLAG, build: SEEDED_BUILD },
  );

  await page.goto('/');
  // The store hydrates after the first client render (skipHydration); wait for
  // the seeded build to become the active system before clicking.
  await expect(page.locator('select[aria-label="Active system"]')).toHaveValue('b1', {
    timeout: 15_000,
  });

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button[aria-label="Export HTML"]').click();
  const download = await downloadPromise;

  const htmlPath = test.info().outputPath('report.html');
  await download.saveAs(htmlPath);
  const html = readFileSync(htmlPath, 'utf8');

  // The footer's link and its visible text.
  expect(html).toContain(`<a href="${SITE}">${SITE_HOST}</a>`);
  expect(html).toContain(`${SITE_HOST} · Report ID`);
  // The re-import link opens the build in the app, on the same host.
  expect(html).toContain(`${SITE}/compare?builds=`);
  // And nothing names any other host.
  expect(html).not.toContain('concreteinfo.co.in');
});
