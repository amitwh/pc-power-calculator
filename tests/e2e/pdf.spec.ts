import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

/**
 * End-to-end proof that the app's PDF button hands the real build to the
 * react-pdf renderer: a real browser download, parsed back out of the PDF's
 * text layer. It exercises the whole path — store rehydration, useCalc, the
 * report model, the lazy renderer chunk, the browser-side logo/QR loaders —
 * rather than the renderer in isolation.
 *
 * The seeded build's annual cost is what the calculator actually computes for
 * these parts at the Indian default tariff (₹6.50/kWh + 8% duty). It is the
 * reconciled schedule sum the PDF prints in both the hero and the prose line.
 */

const STORAGE_KEY = 'pc-power-builds';
const GEO_FLAG = 'pc-power-geo-detected';

function hasBinary(name: string): boolean {
  try {
    execFileSync(name, ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

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

test('exports the report with reconciled totals, brand content and a QR permalink', async ({
  page,
}) => {
  test.skip(!hasBinary('pdftotext'), 'pdftotext is not installed');
  test.setTimeout(90_000);

  await page.addInitScript(
    ({ key, geoFlag, build }) => {
      // Pin the tariff: auto-detection must not rewrite the seeded location
      // (and therefore the cost) from the runner's own IP.
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
  // the seeded build to become the active system before clicking, otherwise
  // the click lands on a not-yet-hydrated button and does nothing.
  await expect(page.locator('select[aria-label="Active system"]')).toHaveValue('b1', {
    timeout: 15_000,
  });

  const downloadPromise = page.waitForEvent('download');
  await page.locator('button[aria-label="Export PDF"]').click();
  const download = await downloadPromise;

  const pdfPath = test.info().outputPath('report.pdf');
  await download.saveAs(pdfPath);

  const text = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });

  // Running footer proves pagination rendered.
  expect(text).toContain('Page 1 of');
  // The faint brand watermark is in the text layer (raw extraction, because
  // its overlap with table rows splits the phrase in -layout mode).
  const rawText = execFileSync('pdftotext', [pdfPath, '-'], { encoding: 'utf8' });
  expect(rawText.replace(/\s+/g, '')).toContain(
    'ConcreteInfoPCPowerConsumptionCalculator',
  );
  // The hero total and the schedule prose must agree, with a real rupee glyph
  // (the retired jsPDF renderer could only print "Rs.").
  expect(text).toContain('₹10,436.26');
  expect(text).toContain('The schedule totals ₹10,436.26');
  expect(text).not.toContain('Rs.');

  // The seeded build's identity and its synthetic case-fan row.
  expect(text).toContain('Gaming PC');
  expect(text).toContain('Case fan');
  // Carbon uses a real subscript glyph from the embedded font.
  expect(text).toContain('CO₂e');
  // Continuation pages carry the build identity beside the app icon.
  expect(text).toMatch(/Gaming build · PCP-/);
  // The QR card is only printed when the browser generated a share permalink.
  expect(text).toContain('Scan to open this build');
  // The printed URL is shortened; the full token lives in the QR only, so the
  // card cannot push the closing sections onto a fourth page.
  expect(text).toContain('/build/…');
  expect(text).not.toMatch(/\/build\/[A-Za-z0-9_-]{200,}/);

  if (hasBinary('pdfinfo')) {
    const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
    const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
    expect(pages).toBeGreaterThanOrEqual(2);
    expect(pages).toBeLessThanOrEqual(3);
  }
});
