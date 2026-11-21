/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { buildExportHtml } from '@/lib/export/html';
import { REPORT_DISCLAIMER, reportFileName, type PdfReport } from '@/lib/export/report';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

const inr: CurrencyInfo = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  decimalDigits: 2,
};

const build: BuildConfig = {
  id: 'x',
  name: 'Test rig',
  category: 'gaming',
  components: { cpu: 'cpu-amd-ryzen-7-7800x3d' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};

const report: PdfReport = {
  buildName: 'Test rig',
  buildCategory: 'gaming',
  locationLabel: 'Kerala, India',
  tariffLabel: 'Manual override — 7.50 INR/kWh',
  currency: inr,
  devices: [
    { name: 'AMD Ryzen 7 7800X3D', category: 'cpu', qty: 1, unitW: 120, totalW: 120, basis: 'rated' },
    { name: 'NVIDIA RTX 4080', category: 'gpu', qty: 1, unitW: 320, totalW: 320, basis: 'measured' },
    { name: 'Corsair Vengeance 32GB', category: 'ram', qty: 2, unitW: 5, totalW: 10, basis: 'estimated' },
    { name: 'Seasonic Focus 850W', category: 'psu', qty: 1, unitW: null, totalW: 0, basis: 'rated' },
  ],
  typicalComponentW: 450,
  idleWallW: 55,
  psu: {
    name: 'Seasonic Focus GX-850',
    ratedW: 850,
    certification: '80 PLUS Gold',
    efficiencyAtLoad: 0.9,
    recommendedW: 700,
    peakComponentW: 450,
    peakWallW: 500,
  },
  schedule: [
    { name: 'Gaming', hoursPerDay: 3, daysPerWeek: 5, drawW: 450, kwhYear: 351, costYear: 2632 },
    { name: 'Office', hoursPerDay: 8, daysPerWeek: 5, drawW: 120, kwhYear: 250, costYear: 1875 },
  ],
  totals: {
    daily: { kwh: 1.8, cost: 13.5 },
    monthly: { kwh: 55, cost: 412 },
    yearly: { kwh: 660, cost: 4950 },
  },
  measured: { idle_w: 60, load_w: 480, avg_w: 90 },
  tariffVerifiedAt: '2026-10-01',
  tariffSource: 'KSEB published tariff',
  tariffEstimated: false,
  catalogVerifiedAt: '2026-09-15',
  suggestedCategory: { label: 'Gaming', reason: 'A 320 W GPU — the profile is GPU-led.' },
  upsEfficiency: 0.94,
};

const html = () => buildExportHtml(report, build);

function scriptBlock(source: string): string {
  const match = source.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('embedded build-config script not found');
  return match[1];
}

describe('buildExportHtml — document shape', () => {
  test('is a complete, self-contained HTML5 document', () => {
    const out = html();
    expect(out).toMatch(/^<!doctype html>/i);
    expect(out).toContain('<html lang="en">');
    expect(out).toContain('<meta charset="utf-8" />');
    expect(out).toContain('name="viewport"');
    expect(out).toContain('<title>Test rig — PC Power Calculator report</title>');
  });

  test('parses as a well-formed document with the expected structure', () => {
    const doc = new DOMParser().parseFromString(html(), 'text/html');
    // Hero plus the nine numbered report sections.
    expect(doc.querySelectorAll('main > section')).toHaveLength(10);
    // Three non-PSU devices, and the PSU only in the power-supply block.
    expect(doc.querySelectorAll('table tbody tr')).toHaveLength(3);
    expect(doc.querySelector('footer .disclaimer')?.textContent).toBe(REPORT_DISCLAIMER);
    expect(doc.querySelectorAll('.fact-v')).toHaveLength(3);
    expect(doc.querySelectorAll('.gauge-seg').length).toBeGreaterThan(0);
    expect(doc.querySelector('.gauge-marker')).not.toBeNull();
  });

  test('prints the faint ConcreteInfo watermark before the report page', () => {
    const out = html();
    expect(out).toContain('ConcreteInfo PC Power Consumption Calculator');

    const doc = new DOMParser().parseFromString(out, 'text/html');
    const watermark = doc.querySelector('body > .watermark');
    expect(watermark).not.toBeNull();
    expect(watermark?.getAttribute('aria-hidden')).toBe('true');
    expect(watermark?.querySelector('span')?.textContent).toBe(
      'ConcreteInfo PC Power Consumption Calculator',
    );
    // The watermark precedes the report page in the DOM and cannot take clicks.
    expect(doc.querySelector('body > .page')).not.toBeNull();
    expect(watermark?.nextElementSibling?.classList.contains('page')).toBe(true);
    expect(out).toContain('pointer-events: none');
    expect(out).toContain('opacity: .05');
    expect(out).toContain('position: fixed');
  });

  test('renders all nine report sections in order', () => {
    const out = html();
    const headings = [
      'Where the power goes',
      'What each use case costs',
      'How these figures are calculated',
      'Idle, typical and maximum',
      'Components',
      'Power supply',
      'Carbon footprint',
      'What this means',
      'Estimated versus measured',
    ];
    let cursor = -1;
    for (const heading of headings) {
      const at = out.indexOf(`<h2>${heading}</h2>`);
      expect(at, `missing section: ${heading}`).toBeGreaterThan(-1);
      expect(at).toBeGreaterThan(cursor);
      cursor = at;
    }
  });

  test('renders the eight metadata labels and the report ID', () => {
    const out = html();
    for (const label of [
      'Report ID',
      'Generated',
      'System',
      'Location',
      'Tariff currency',
      'Engine',
      'Tariff source',
      'Catalog data verified',
    ]) {
      expect(out).toContain(`>${label}</span>`);
    }
    expect(out).toMatch(/PCP-\d{8}-[0-9A-Z]{5}/);
    expect(out).toContain('v2.1');
    expect(out).toContain('INR (₹)');
  });

  test('renders the footer attribution, disclaimer, copyright and re-import link', () => {
    const out = html();
    expect(out).toContain('Generated by PC Power Calculator');
    expect(out).toContain('A ConcreteInfo product');
    expect(out).toContain(REPORT_DISCLAIMER);
    expect(out).toContain('© 2026 ConcreteInfo');
    expect(out).toContain('Open in PC Power Calculator');
    expect(out).toContain('https://pcpower.concreteinfo.co.in/compare?builds=');
    expect(out).toContain('Report ID ');
    expect(out).toContain('(IST)');
  });

  test('embeds the build config JSON without breaking out of the script element', () => {
    const out = html();
    const payload = JSON.parse(
      scriptBlock(out)
        .replace(/\\u003c/g, '<')
        .replace(/\\u003e/g, '>')
        .replace(/\\u0026/g, '&'),
    ) as { version: number; build: BuildConfig };
    expect(payload.version).toBe(1);
    expect(payload.build.name).toBe('Test rig');
    expect(scriptBlock(out)).not.toContain('</script>');
  });
});

describe('buildExportHtml — report content matches the PDF', () => {
  test('carries the hero cost and the three coloured facts', () => {
    const out = html();
    expect(out).toContain('ESTIMATED ANNUAL RUNNING COST');
    // The hero now uses the reconciled schedule total (2,632 + 1,875), not the
    // unrelated totals.yearly.cost the fixture carries.
    expect(out).toContain('₹4,507.00');
    expect(out).toContain('per year');
    expect(out).toMatch(/\.fact-month\s*\{[^}]*#c93a18/);
    expect(out).toMatch(/\.fact-day\s*\{[^}]*#0b6f96/);
    expect(out).toMatch(/\.fact-energy\s*\{[^}]*#1a7a56/);
    // Dark-mode variants keep the same meaning with readable contrast.
    expect(out).toMatch(/\.fact-month\s*\{[^}]*#ff9d82/);
    expect(out).toMatch(/\.fact-day\s*\{[^}]*#6cc9fa/);
    expect(out).toMatch(/\.fact-energy\s*\{[^}]*#34d399/);
  });

  test('draws the power breakdown with one bar per non-PSU category', () => {
    const out = html();
    expect(out).toContain('Share of the 450.0 W estimated typical component draw');
    expect(out).toContain('GPU');
    expect(out).toContain('320.0 W · 71%');
    // The PSU is explicitly excluded from the breakdown.
    expect(out).not.toContain('>PSU</span>');
  });

  test('renders the use-case bars and the schedule total', () => {
    const out = html();
    expect(out).toContain('Bars are scaled to the largest single use case (₹2,632.00)');
    expect(out).toContain('The schedule totals ₹4,507.00 a year.');
    expect(out).toContain('351.0 kWh');
  });

  test('renders the six calculation steps and the verified tariff note', () => {
    const out = html();
    expect(out.match(/<li>/g)).toHaveLength(6);
    expect(out).toContain('Tariff source: KSEB published tariff, 2026-10-01.');
  });

  test('renders the components table with category and basis colours', () => {
    const out = html();
    expect(out).toContain('<th>Device</th>');
    expect(out).toContain('AMD Ryzen 7 7800X3D');
    expect(out).toContain('Estimated typical component draw (DC)');
    expect(out).toContain('style="color:#f59e0b"'); // CPU category hex
    expect(out).toMatch(/td\.basis\.estimated\s*\{[^}]*#a15c07/);
    expect(out).toMatch(/td\.basis\.measured\s*\{[^}]*#1a7a56/);
    // The PSU is described as a supply, not a 0 W device row.
    expect(out).not.toContain('Seasonic Focus 850W</td>');
  });

  test('renders the nine power-supply rows and the recommendation', () => {
    const out = html();
    expect(out).toContain('Estimated maximum system draw (wall, AC)');
    expect(out).toContain('Recommended PSU capacity');
    expect(out).toContain('Installed PSU capacity');
    expect(out).toContain('Additional capacity');
    expect(out).toContain('Model / certification');
    expect(out).toContain('Conversion efficiency at this load');
    expect(out).toContain('UPS conversion efficiency');
    expect(out).toContain('Peak draw lost to PSU conversion');
    expect(out).toContain('Seasonic Focus GX-850 · 80 PLUS Gold');
    expect(out).toContain('+150 W');
    expect(out).toContain('The recommendation is a practical PSU size');
    // 850 W installed > 700 W recommended → no undersized warning.
    expect(out).not.toContain('below the recommendation');
  });

  test('shows the undersized warning when the installed PSU is too small', () => {
    const undersized = buildExportHtml(
      { ...report, psu: { ...report.psu, ratedW: 500 } },
      build,
    );
    expect(undersized).toContain('Installed supply is 200 W below the recommendation');
  });

  test('renders the carbon block and the six equivalences', () => {
    const out = html();
    expect(out).toContain('Grid factor used');
    expect(out).toContain('0.71 kg CO2e / kWh');
    expect(out).toContain('Estimated annual emissions');
    expect(out).toContain('tonnes over 5 years at this usage');
    // One carbon + three fuel + one water + one everyday sentence as row keys.
    expect(out).toContain('kg of CO₂e, at the grid factor used.');
    expect(out).toContain('Coal-fired generation would burn about');
    expect(out).toContain('A combined-cycle gas plant would burn roughly');
    expect(out).toContain('On a diesel generator it would take about');
    expect(out).toContain('litres of water.');
    expect(out).toContain('Enough electricity to drive an electric car');
    expect(out).toContain('These are unit conversions of the annual kWh figure');
  });

  test('renders the consumption gauge, band line and suggestion', () => {
    const out = html();
    expect(out).toContain('class="gauge"');
    expect(out).toContain('class="gauge-marker"');
    expect(out).toContain('Everyday - 75.3 W average, 660.0 kWh a year');
    expect(out).toContain('A desktop doing real work.');
    expect(out).toContain('Looks like: Gaming - A 320 W GPU');
  });

  test('renders measured deltas and falls back when no readings exist', () => {
    const out = html();
    expect(out).toContain('Idle draw (wall) — model 55.0 W');
    expect(out).toContain('60.0 W (+9%)');
    expect(out).toContain('Full load (wall) — model 500.0 W');
    expect(out).toContain('Daily average (wall) — model 75.0 W');
    expect(out).toContain('Your meter is the authoritative figure.');

    const noReadings = buildExportHtml({ ...report, measured: undefined }, build);
    expect(noReadings).toContain('No meter readings were entered for this build.');
  });

  test('omits the use-case section and shows the empty components state', () => {
    const empty = buildExportHtml(
      {
        ...report,
        devices: [],
        schedule: [],
        typicalComponentW: 0,
        measured: undefined,
      },
      build,
    );
    expect(empty).not.toContain('What each use case costs');
    expect(empty).toContain('No components selected.');
  });
});

describe('buildExportHtml — safety and offline rendering', () => {
  test('escapes a hostile build name in the title, heading and JSON block', () => {
    const malicious = '"><script>alert(1)</script>';
    const out = buildExportHtml(
      { ...report, buildName: malicious },
      { ...build, name: malicious },
    );

    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out).toContain(
      '<title>&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; — PC Power Calculator report</title>',
    );

    // The JSON payload keeps the raw value but cannot terminate the element.
    const block = scriptBlock(out);
    expect(block).not.toContain('</script>');
    expect(block).toContain('\\u003cscript\\u003e');
  });

  test('escapes &, quotes and Unicode line separators', () => {
    const LS = '\u2028';
    const PS = '\u2029';
    const tricky = `A & "B" 'C' ${LS}D ${PS}E`;
    const out = buildExportHtml({ ...report, buildName: tricky }, { ...build, name: tricky });

    expect(out).toContain('A &amp;');
    expect(out).toContain('&quot;B&quot;');
    expect(out).toContain('&#39;C&#39;');
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    const block = scriptBlock(out);
    expect(block).not.toContain(LS);
    expect(block).not.toContain(PS);
  });

  test('uses no images, icon fonts or external asset URLs', () => {
    const out = html();
    expect(out).not.toContain('<img');
    expect(out).not.toContain('<link');
    expect(out).not.toContain('@import');
    expect(out).not.toMatch(/url\(/);

    const urls = out.match(/https?:\/\/[^\s"'<>)]+/g) ?? [];
    expect(urls).toHaveLength(2);
    for (const url of urls) {
      expect(url.startsWith('https://pcpower.concreteinfo.co.in')).toBe(true);
    }
  });

  test('ships screen, dark-mode and print styles', () => {
    const out = html();
    // Screen-scoped: a dark-mode OS must not print a near-black page.
    expect(out).toContain('@media screen and (prefers-color-scheme: dark)');
    expect(out).toContain('@page { size: A4; margin: 16mm 14mm; }');
    expect(out).toContain('thead { display: table-header-group; }');
    expect(out).toContain('section { break-inside: avoid; }');
    expect(out).toContain('tr { break-inside: avoid; }');
    expect(out).toContain('position: fixed');
  });
});

describe('reportFileName', () => {
  test('uses the same slug, date and report ID pattern for both formats', () => {
    const now = new Date('2026-11-21T09:30:00Z');
    const pdfName = reportFileName(report, 'pdf', now);
    const htmlName = reportFileName(report, 'html', now);
    expect(pdfName).toMatch(/^CI_PC-Power_test-rig_2026-11-21_PCP-\d{8}-[0-9A-Z]{5}\.pdf$/);
    expect(htmlName).toBe(pdfName.replace(/\.pdf$/, '.html'));
  });
});
