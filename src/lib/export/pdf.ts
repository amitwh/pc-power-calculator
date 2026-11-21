import type { ComponentCategory } from '@/types/component';
import type { CurrencyInfo } from '@/types/currency';
import type { MeasuredReadings } from '@/types/build';
import { formatCost } from '@/lib/calc/format';
import { categoryColor } from '@/lib/categoryColors';
import { CALC_ENGINE_VERSION } from '@/lib/calc/version';
import { CONSUMPTION_TIERS, averageWallW, tierFor, tierPosition } from '@/lib/calc/classify';
import { equivalences } from '@/lib/calc/equivalences';

export const PDF_AUTHOR = 'Amit Haridas';
export const PDF_SOURCE_URL = 'https://pcpower.concreteinfo.co.in';

/** How a wattage figure was obtained — printed next to it. */
export type PowerBasis = 'rated' | 'measured' | 'estimated' | 'unknown';

/** One row in the report's device table (a distinct component + unit count). */
export interface PdfDeviceRow {
  name: string;
  category: ComponentCategory;
  qty: number;
  /** Rated watts per unit after any TDP override / overclock (null = unknown). */
  unitW: number | null;
  totalW: number;
  /** Provenance of the wattage, shown as a column rather than assumed. */
  basis: PowerBasis;
  /** Where the figure came from (e.g. "amd.com", "techpowerup", "estimate"). */
  source?: string;
}

/** One row in the report's usage table (a scheduled workload). */
export interface PdfScheduleRow {
  name: string;
  hoursPerDay: number;
  daysPerWeek: number;
  drawW: number;
  kwhYear: number;
  costYear: number;
}

/** The power supply, described as a power supply rather than a 0 W device. */
export interface PdfPsuInfo {
  name: string | null;
  ratedW: number | null;
  /** e.g. "80 Plus Bronze". */
  certification: string | null;
  /** Conversion efficiency at the machine's operating load, 0–1. */
  efficiencyAtLoad: number | null;
  recommendedW: number;
  /** Component (DC) draw with every part at 100% — the sizing basis. */
  peakComponentW: number;
  /** Wall (AC) draw at that same load, after conversion losses. */
  peakWallW: number;
}

export interface PdfReport {
  buildName: string;
  buildCategory?: string;
  locationLabel: string;
  tariffLabel: string;
  currency: CurrencyInfo;
  devices: PdfDeviceRow[];
  /** Estimated typical component draw (DC): the sum of rated wattages. */
  typicalComponentW: number;
  /** Wall draw while on but idle, W. */
  idleWallW: number;
  psu: PdfPsuInfo;
  schedule: PdfScheduleRow[];
  totals: {
    daily: { kwh: number; cost: number };
    monthly: { kwh: number; cost: number };
    yearly: { kwh: number; cost: number };
  };
  /** Owner's wall readings, when they entered any. */
  measured?: MeasuredReadings;
  /** Grid carbon intensity, kg CO2e per kWh. Defaults to the India average. */
  gridFactorKgPerKwh?: number;
  /** When the tariff data was last verified (ISO date). */
  tariffVerifiedAt?: string;
  /** Where the tariff figure came from (country-level provenance). */
  tariffSource?: string;
  /** True when the tariff is a banded estimate, printed with an asterisk. */
  tariffEstimated?: boolean;
  /** What the machine looks like it is for, with the reason. */
  suggestedCategory?: { label: string; reason: string };
  /** UPS conversion efficiency in the power path (1 when no UPS is fitted). */
  upsEfficiency?: number;
  /** When any component in the build was last catalogued / verified (ISO date). */
  catalogVerifiedAt?: string;
}

const CATEGORY_LABEL: Record<ComponentCategory, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  storage: 'Storage',
  motherboard: 'Motherboard',
  psu: 'PSU',
  cooler: 'Cooler',
  fan: 'Fan',
  monitor: 'Monitor',
  add_in_card: 'Add-in card',
  optical_drive: 'Optical drive',
  ups: 'UPS',
  peripheral: 'Peripheral',
};

const BASIS_LABEL: Record<PowerBasis, string> = {
  rated: 'Rated',
  measured: 'Measured',
  estimated: 'Estimated',
  unknown: '—',
};

/** Default grid intensity when the caller does not supply one. */
export const DEFAULT_GRID_FACTOR_KG_PER_KWH = 0.71;

/**
 * jsPDF's core fonts are WinAnsi-encoded — the rupee sign and other
 * non-Latin-1 glyphs would render as garbage. Map the common ones and strip
 * anything else outside the encodable range.
 */
export function pdfText(s: string): string {
  return s
    .replace(/₹/g, 'Rs. ')
    .replace(/[×✓]/g, 'x')
    .replace(/[—–]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

/** Currency-formatted amount safe for the PDF's WinAnsi fonts. */
export function pdfMoney(amount: number, currency: CurrencyInfo): string {
  return pdfText(formatCost(amount, currency));
}

/** One decimal, Indian grouping — the report's single precision rule. */
export function pdfNum(n: number, decimals = 1): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

export function pdfKwh(kwh: number, decimals = 1): string {
  return `${pdfNum(kwh, decimals)} kWh`;
}

/**
 * Sum a column the reader can add up themselves.
 *
 * The old report summed unrounded values and printed rounded ones, so the
 * workload table's rows disagreed with its own total (564 vs 565). A printed
 * total must equal the printed rows; internal maths stays full precision.
 */
export function sumRounded(values: number[], decimals = 1): number {
  const factor = 10 ** decimals;
  const total = values.reduce((acc, v) => acc + Math.round(v * factor), 0);
  return total / factor;
}

/** Map a catalog source string onto the report's three-way power basis. */
export function basisFor(source: string | null | undefined): PowerBasis {
  const s = (source ?? '').trim().toLowerCase();
  if (!s || s.startsWith('estimat')) return 'estimated';
  if (s.includes('community') || s.includes('techpowerup') || s.includes('review') || s.includes('measure')) {
    return 'measured';
  }
  if (['amd.com', 'intel-ark', 'nvidia.com', 'vendor-spec', 'manufacturer'].includes(s)) {
    return 'rated';
  }
  return 'estimated';
}

/** "80 Plus Bronze" from a raw catalog rating token. */
export function certificationLabel(rating: string | null | undefined): string | null {
  if (!rating) return null;
  const map: Record<string, string> = {
    none: 'No 80 PLUS certification',
    '80-plus': '80 PLUS (base)',
    bronze: '80 PLUS Bronze',
    silver: '80 PLUS Silver',
    gold: '80 PLUS Gold',
    platinum: '80 PLUS Platinum',
    titanium: '80 PLUS Titanium',
  };
  return map[rating.toLowerCase()] ?? rating;
}

const BRAND: [number, number, number] = [0xe5, 0x46, 0x1f];
const INK: [number, number, number] = [0x1f, 0x29, 0x37];
const MUTED: [number, number, number] = [0x6b, 0x72, 0x80];
const RULE: [number, number, number] = [0xe5, 0xe7, 0xeb];
const ZEBRA: [number, number, number] = [0xfa, 0xfb, 0xfc];
const RED: [number, number, number] = [0xb9, 0x1c, 0x1c];
const GREEN: [number, number, number] = [0x1a, 0x7a, 0x56];

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 40;
const CONTENT_W = PAGE_W - M * 2;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'build';
}

/** IST date, because every generated document is dated in the user's zone. */
function istDate(now = new Date()): string {
  return now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/** A short horizontal rule. */
function hr(doc: import('jspdf').jsPDF, y: number, color = RULE): void {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.8);
  doc.line(M, y, PAGE_W - M, y);
}

/** Section heading: brand-dark, small caps feel, with a rule above. */
function section(doc: import('jspdf').jsPDF, y: number, title: string): number {
  hr(doc, y);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(pdfText(title.toUpperCase()), M, y + 16);
  return y + 30;
}

interface BarRow {
  label: string;
  value: number;
  /** Right-hand readout, already formatted. */
  readout: string;
  color: [number, number, number];
}

/**
 * Horizontal bar chart drawn with vector rectangles.
 *
 * Bars, not a pie: the reader's job here is comparing magnitudes, and a pie
 * makes that harder while also needing arc maths that jsPDF's core API does
 * not provide cleanly.
 */
function barChart(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  w: number,
  rows: BarRow[],
  opts: { max?: number; labelW?: number; readoutW?: number } = {},
): number {
  const labelW = opts.labelW ?? 132;
  const readoutW = opts.readoutW ?? 116;
  const barW = Math.max(40, w - labelW - readoutW - 12);
  const max = opts.max ?? Math.max(...rows.map((r) => r.value), 1);
  const rowH = 18;

  rows.forEach((r, i) => {
    const top = y + i * rowH;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);

    const label = doc.splitTextToSize(pdfText(r.label), labelW - 6)[0] as string;
    doc.text(label, x, top + 9);

    // Track, then the fill.
    doc.setFillColor(0xf1, 0xf3, 0xf5);
    doc.rect(x + labelW, top + 5, barW, 8, 'F');
    const filled = max > 0 ? Math.max(1, (r.value / max) * barW) : 0;
    doc.setFillColor(...r.color);
    doc.rect(x + labelW, top + 5, filled, 8, 'F');

    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfText(r.readout), x + w, top + 9, { align: 'right' });
  });

  return rows.length * rowH;
}

/** A labelled value row used by the Power supply block. */
function kvRows(
  doc: import('jspdf').jsPDF,
  y: number,
  rows: Array<{ k: string; v: string; emphasis?: boolean; color?: [number, number, number] }>,
): number {
  const rowH = 15;
  rows.forEach((r, i) => {
    const top = y + i * rowH;
    if (i % 2 === 0) {
      doc.setFillColor(...ZEBRA);
      doc.rect(M, top, CONTENT_W, rowH, 'F');
    }
    doc.setFont('helvetica', r.emphasis ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(pdfText(r.k), M + 6, top + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(r.color ?? INK));
    doc.text(pdfText(r.v), PAGE_W - M - 6, top + 10, { align: 'right' });
  });
  return rows.length * rowH;
}

/** Start a new page when a block would run into the footer zone. */
function ensureSpace(doc: import('jspdf').jsPDF, y: number, needed: number): number {
  const bottom = PAGE_H - 92;
  if (y + needed <= bottom) return y;
  doc.addPage();
  return 48;
}

/** Wrapped paragraph; returns the y after the block. */
function paragraph(
  doc: import('jspdf').jsPDF,
  y: number,
  text: string,
  opts: { size?: number; color?: [number, number, number]; bold?: boolean; indent?: number } = {},
): number {
  const size = opts.size ?? 8.5;
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(...(opts.color ?? MUTED));
  const lines = doc.splitTextToSize(pdfText(text), CONTENT_W - (opts.indent ?? 0)) as string[];
  doc.text(lines, M + (opts.indent ?? 0), y);
  return y + lines.length * (size + 3);
}

/**
 * A four-column metadata grid — the cover-block details the house style asks
 * for (version, date, author) extended with everything a reader needs to
 * reproduce or query the report.
 */
function metaGrid(
  doc: import('jspdf').jsPDF,
  y: number,
  items: Array<[string, string]>,
): number {
  const cols = 4;
  const cellW = CONTENT_W / cols;
  const rowH = 26;
  items.forEach(([k, v], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * cellW;
    const top = y + row * rowH;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    doc.text(pdfText(k.toUpperCase()), x, top + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    const line = doc.splitTextToSize(pdfText(v), cellW - 10)[0] as string;
    doc.text(line, x, top + 20);
  });
  return y + Math.ceil(items.length / cols) * rowH;
}

/** The annual cost, as the page's headline. */
function heroCost(
  doc: import('jspdf').jsPDF,
  y: number,
  report: PdfReport,
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text('ESTIMATED ANNUAL RUNNING COST', M, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(...BRAND);
  const amount = pdfMoney(report.totals.yearly.cost, report.currency);
  doc.text(amount, M, y + 32);

  const amountW = doc.getTextWidth(amount);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text('per year', M + amountW + 8, y + 32);

  // Supporting figures go on their own row. Sharing the baseline with the
  // headline made "per year" collide with the monthly figure on wide amounts.
  const facts = [
    ['Per month', pdfMoney(report.totals.monthly.cost, report.currency)],
    ['Per day', pdfMoney(report.totals.daily.cost, report.currency)],
    ['Energy / year', pdfKwh(report.totals.yearly.kwh)],
  ];
  let fx = PAGE_W - M - 90;
  for (const [k, v] of facts.slice().reverse()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(pdfText(k.toUpperCase()), fx, y + 50, { align: 'right' });
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(pdfText(v), fx, y + 64, { align: 'right' });
    fx -= 108;
  }
  doc.setFont('helvetica', 'normal');
  return y + 76;
}

/** Full generation timestamp in IST, e.g. "21 Nov 2026, 14:45". */
export function istTimestamp(now = new Date()): string {
  const d = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const day = d.getUTCDate().toString().padStart(2, '0');
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${d.getUTCFullYear()}, ${hh}:${mm}`;
}

/** A short, quotable identifier so a printed report can be referenced. */
export function makeReportId(buildName: string, now = new Date()): string {
  const d = new Date(now.getTime() + 5.5 * 3600 * 1000); // IST
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
  let hash = 0;
  for (let i = 0; i < buildName.length; i++) hash = (hash * 31 + buildName.charCodeAt(i)) >>> 0;
  return `PCP-${stamp}-${hash.toString(36).toUpperCase().slice(0, 5).padStart(5, '0')}`;
}

/**
 * Footer on every page: who made it, the site, the estimate caveat, then page
 * number and report ID — the two things a printed page needs to be traceable.
 */
function footers(
  doc: import('jspdf').jsPDF,
  date: string,
  reportId: string,
  disclaimer: string,
): void {
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.5);
    doc.line(M, PAGE_H - 74, PAGE_W - M, PAGE_H - 74);

    // Attribution: the product, not a person.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text('Generated by PC Power Calculator  |  A ConcreteInfo product', M, PAGE_H - 60);

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${p} of ${pages}`, PAGE_W - M, PAGE_H - 60, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND);
    doc.textWithLink('pcpower.concreteinfo.co.in', M, PAGE_H - 49, { url: PDF_SOURCE_URL });

    doc.setTextColor(...MUTED);
    doc.text(pdfText(`Report ID ${reportId}  ·  ${date} (IST)`), PAGE_W - M, PAGE_H - 49, {
      align: 'right',
    });

    doc.setFontSize(6.8);
    const lines = doc.splitTextToSize(pdfText(disclaimer), CONTENT_W) as string[];
    doc.text(lines.slice(0, 2), M, PAGE_H - 37);

    doc.setFontSize(6.8);
    doc.setTextColor(...MUTED);
    doc.text(
      pdfText('© 2026 ConcreteInfo. All rights reserved.'),
      M,
      PAGE_H - 20,
    );
    doc.text(
      pdfText('Estimates only — not electrical or financial advice.'),
      PAGE_W - M,
      PAGE_H - 20,
      { align: 'right' },
    );
  }
}

/**
 * Generate the branded, two-page PDF report and trigger the download.
 *
 * jsPDF + autoTable are imported dynamically so they stay out of the app
 * bundle until someone exports (~120 KB gzip).
 */
export async function exportPdf(report: PdfReport): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setProperties({
    title: pdfText(`${report.buildName} - PC Power Calculator report`),
    author: 'PC Power Calculator (ConcreteInfo)',
    creator: 'PC Power Calculator',
    subject: pdfText('PC energy, cost, carbon and PSU sizing estimate'),
  });

  const date = istDate();
  const gridFactor = report.gridFactorKgPerKwh ?? DEFAULT_GRID_FACTOR_KG_PER_KWH;
  const disclaimer =
    'Report generated automatically. Estimates are based on configured hardware, workload assumptions and electricity tariffs. Power figures are modelled from rated specifications (or the basis shown), not measured unless labelled Measured. Carbon uses an editable grid factor, not your supplier\'s fuel mix. Verify specifications with the manufacturer and rates with your utility.';
  const reportId = makeReportId(report.buildName);
  const psu = report.psu;

  /* ── Page 1 ─────────────────────────────────────────────────────────── */

  // Brand bar (the house style's 8 mm top bar).
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 23, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PC POWER CALCULATOR', M, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    pdfText(`${report.currency.code} report · ${date} · ${reportId}`),
    PAGE_W - M,
    15,
    { align: 'right' },
  );

  let y = 48;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(pdfText(report.buildName), M, y);

  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    pdfText(
      [report.buildCategory, report.locationLabel, report.tariffLabel].filter(Boolean).join('   |   '),
    ),
    M,
    y,
  );

  y += 10;
  y = metaGrid(doc, y, [
    ['Report ID', reportId],
    ['Generated', `${istTimestamp()} IST`],
    ['System', report.buildName],
    ['Location', report.locationLabel],
    ['Tariff currency', `${report.currency.code} (${report.currency.symbol.trim()})`],
    ['Engine', `v${CALC_ENGINE_VERSION}`],
    [
      'Tariff source',
      `${report.tariffSource ?? 'Compiled'}${report.tariffVerifiedAt ? ` · ${report.tariffVerifiedAt}` : ''}`,
    ],
    ['Catalog data verified', report.catalogVerifiedAt ?? '—'],
  ]);

  y += 6;
  y = heroCost(doc, y, report);

  // ── Power breakdown by component
  const byCategory = new Map<ComponentCategory, number>();
  for (const d of report.devices) {
    if (d.category === 'psu') continue;
    byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + (d.unitW ?? 0) * d.qty);
  }
  const totalComponentW = [...byCategory.values()].reduce((a, b) => a + b, 0);

  y = section(doc, y, 'Where the power goes');
  y = paragraph(
    doc,
    y,
    `Share of the ${pdfNum(totalComponentW)} W estimated typical component draw, by part category. The PSU is excluded: it converts power rather than consuming it.`,
  );
  y += 4;

  const powerRows: BarRow[] = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, w]) => ({
      label: CATEGORY_LABEL[cat] ?? cat,
      value: w,
      readout: `${pdfNum(w)} W · ${totalComponentW > 0 ? Math.round((w / totalComponentW) * 100) : 0}%`,
      color: categoryColor(cat).pdf,
    }));
  if (powerRows.length > 0) {
    y += barChart(doc, M, y, CONTENT_W, powerRows);
  } else {
    y = paragraph(doc, y, 'No components selected.');
  }

  // ── Cost by use case
  if (report.schedule.length > 0) {
    y = section(doc, y + 6, 'What each use case costs');
    const scheduleTotal = sumRounded(report.schedule.map((s) => s.costYear));
    const maxCost = Math.max(...report.schedule.map((s) => s.costYear), 1);
    const costRows: BarRow[] = report.schedule
      .slice()
      .sort((a, b) => b.costYear - a.costYear)
      .map((s) => ({
        label: s.name,
        value: s.costYear,
        readout: `${pdfMoney(s.costYear, report.currency)} · ${pdfKwh(s.kwhYear)}`,
        color: [0x6a, 0x5a, 0xcd],
      }));
    y = paragraph(
      doc,
      y,
      `Bars are scaled to the largest single use case (${pdfMoney(maxCost, report.currency)}). The schedule totals ${pdfMoney(scheduleTotal, report.currency)} a year.`,
    );
    y += 4;
    y += barChart(doc, M, y, CONTENT_W, costRows, { readoutW: 150, labelW: 150 });
  }

  // ── Method: this is what makes the numbers auditable, so it stays on the
  // page with the charts rather than being appended after the tables.
  y = ensureSpace(doc, y + 12, 140);
  y = section(doc, y, 'How these figures are calculated');
  const steps = [
    'Component draw: each part contributes its rated wattage (or the basis shown in the table). Overclock adds a percentage on top of the CPU and GPU figures.',
    'Workload draw: each use case applies a utilisation factor to those components — office and browsing run a fraction of full load, gaming and rendering run close to it.',
    'Idle draw: a small fixed share of each component for the hours the machine is on but not working.',
    'PSU conversion: component draw is divided by the supply\'s efficiency at that load (a load-dependent 80 PLUS curve), giving the wall figure the meter sees.',
    'Energy: wall watts x hours per day x days per week, summed across use cases and idle, then annualised.',
    'Cost: energy is priced through the regional tariff, including slab tiers and taxes where the tariff data provides them.',
  ];
  steps.forEach((step, i) => {
    y = paragraph(doc, y, `${i + 1}.  ${step}`, { size: 8, indent: 0 });
  });
  y = paragraph(
    doc,
    y + 2,
    report.tariffEstimated
      ? `* The tariff used is an estimated rate (${report.tariffSource ?? 'compiled band'}), not a verified bill for a specific distributor. Override it with your own rate for an exact figure.`
      : `Tariff source: ${report.tariffSource ?? 'compiled published tariffs'}, ${report.tariffVerifiedAt ?? 'date not recorded'}.`,
    { size: 7.5 },
  );


  // ── Idle vs typical vs maximum
  y = ensureSpace(doc, y + 10, 110);
  y = section(doc, y, 'Idle, typical and maximum');
  y += kvRows(doc, y, [
    { k: 'Idle (on, nothing running — wall)', v: `${pdfNum(report.idleWallW)} W` },
    { k: 'Typical (components at rated draw — DC)', v: `${pdfNum(report.typicalComponentW)} W` },
    { k: 'Maximum (all components at 100% — wall)', v: `${pdfNum(psu.peakWallW)} W` },
  ]);
  y += 6;
  y = paragraph(
    doc,
    y,
    'Idle is the figure that decides a 24x7 NAS or server bill: it runs every hour the machine is on. A machine that idles 100 W for 20 hours costs more than one that peaks at 400 W for two.',
  );
  y += 8;

  /* ── Page 2 ─────────────────────────────────────────────────────────── */
  doc.addPage();
  y = 48;

  // ── Devices
  y = ensureSpace(doc, y, 160);
  y = section(doc, y, 'Components');
  const deviceRows = report.devices
    .filter((d) => d.category !== 'psu')
    .map((d) => [
      pdfText(d.name),
      CATEGORY_LABEL[d.category] ?? d.category,
      String(d.qty),
      d.unitW != null ? pdfNum(d.unitW) : '—',
      d.unitW != null ? pdfNum(d.totalW) : '—',
      BASIS_LABEL[d.basis],
    ]);

  autoTable(doc, {
    startY: y,
    head: [['Device', 'Category', 'Qty', 'W / unit', 'Total W', 'Basis']],
    body: deviceRows,
    foot: [['Estimated typical component draw (DC)', '', '', '', pdfNum(report.typicalComponentW), '']],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.4,
    },
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [0xf3, 0xf4, 0xf6], textColor: INK, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ZEBRA },
    columnStyles: {
      1: { cellWidth: 78 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 52, halign: 'right' },
      4: { cellWidth: 52, halign: 'right' },
      5: { cellWidth: 58, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 1) {
          const cat = report.devices.filter((d) => d.category !== 'psu')[data.row.index]?.category;
          if (cat) data.cell.styles.textColor = categoryColor(cat).pdf;
        }
        if (data.column.index === 5) {
          const basis = report.devices.filter((d) => d.category !== 'psu')[data.row.index]?.basis;
          // Estimated figures are the weakest claim on the page; say so in colour.
          if (basis === 'estimated') data.cell.styles.textColor = [0xa1, 0x5c, 0x07];
          if (basis === 'measured') data.cell.styles.textColor = GREEN;
        }
      }
    },
    margin: { left: M, right: M },
  });

  type WithLastTable = { lastAutoTable?: { finalY: number } };
  y = ((doc as unknown as WithLastTable).lastAutoTable?.finalY ?? y) + 22;

  y = paragraph(
    doc,
    y,
    'Rated = the manufacturer\'s published figure. Measured = from independent testing. Estimated = derived by the calculator where no figure was published. These are component (DC) figures, before power-supply conversion.',
  );
  y += 8;

  // ── Power supply
  y = ensureSpace(doc, y + 8, 220);
  y = section(doc, y, 'Power supply');
  const additional =
    psu.ratedW != null ? psu.ratedW - psu.recommendedW : null;
  y += kvRows(doc, y, [
    { k: 'Estimated typical component draw (DC)', v: `${pdfNum(report.typicalComponentW)} W` },
    { k: 'Estimated maximum system draw (wall, AC)', v: `${pdfNum(psu.peakWallW)} W` },
    { k: 'Recommended PSU capacity', v: `${pdfNum(psu.recommendedW, 0)} W`, emphasis: true },
    { k: 'Installed PSU capacity', v: psu.ratedW != null ? `${pdfNum(psu.ratedW, 0)} W` : 'Not selected' },
    {
      k: 'Additional capacity',
      v:
        additional == null
          ? '—'
          : `${additional >= 0 ? '+' : ''}${pdfNum(additional, 0)} W`,
      color: additional != null && additional < 0 ? RED : GREEN,
    },
    { k: 'Model / certification', v: [psu.name, psu.certification].filter(Boolean).join(' · ') || '—' },
    {
      k: 'Conversion efficiency at this load',
      v: psu.efficiencyAtLoad != null ? `${Math.round(psu.efficiencyAtLoad * 100)}%` : '—',
    },
    {
      k: 'UPS conversion efficiency',
      v: report.upsEfficiency && report.upsEfficiency < 1 ? `${Math.round(report.upsEfficiency * 100)}%` : 'No UPS in the path',
    },
    {
      k: 'Peak draw lost to PSU conversion',
      v:
        psu.efficiencyAtLoad != null
          ? `${pdfNum(psu.peakWallW * (1 - psu.efficiencyAtLoad))} W`
          : '—',
    },
  ]);
  y += 8;
  y = paragraph(
    doc,
    y,
    `The recommendation is a practical PSU size: peak component draw plus 35% headroom for transient spikes and capacitor ageing, rounded up to the nearest standard rating — not peak draw multiplied by 1.35 exactly. Wall draw is component draw divided by the supply's conversion efficiency at this load (P_wall = P_components / efficiency).`,
  );
  y += 8;

  if (psu.ratedW != null && psu.ratedW < psu.recommendedW) {
    doc.setFillColor(0xfe, 0xf2, 0xf2);
    doc.rect(M, y, CONTENT_W, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...RED);
    doc.text(
      pdfText(`Installed supply is ${pdfNum(psu.recommendedW - psu.ratedW, 0)} W below the recommendation — undersized for sustained full load.`),
      M + 6,
      y + 13,
    );
    y += 28;
  }

  // ── Carbon
  const co2kg = report.totals.yearly.kwh * gridFactor;
  y = ensureSpace(doc, y + 6, 150);
  y = section(doc, y, 'Carbon footprint');
  y += kvRows(doc, y, [
    { k: 'Annual energy', v: pdfKwh(report.totals.yearly.kwh) },
    { k: 'Grid factor used', v: `${pdfNum(gridFactor, 2)} kg CO2e / kWh` },
    { k: 'Estimated annual emissions', v: `${pdfNum(co2kg, 1)} kg CO2e`, emphasis: true },
    {
      k: 'Equivalent',
      v: `${pdfNum(co2kg / 1000, 2)} tonnes over 5 years at this usage`,
    },
  ]);
  y += 6;
  y = paragraph(
    doc,
    y,
    'A grid factor is an average, not a promise: it varies by state, season and time of day, and a supplier\'s published fuel mix will differ from it. Change the factor to your own supplier or state figure before quoting this number.',
  );
  y += 8;

  // ── What this means
  const avgW = averageWallW(report.totals.yearly.kwh);
  const tier = tierFor(avgW);
  // Six: the fuel it took, the carbon it produced, and what else it could power.
  const allEq = equivalences(report.totals.yearly.kwh, co2kg);
  const carrier = [
    ...allEq.filter((e) => e.group === 'carbon').slice(0, 1),
    ...allEq.filter((e) => e.group === 'fuel').slice(0, 3),
    ...allEq.filter((e) => e.group === 'water').slice(0, 1),
    ...allEq.filter((e) => e.group === 'everyday').slice(0, 1),
  ];
  // Gauge + band + suggestion + six equivalence rows.
  y = ensureSpace(doc, y + 6, 230);
  y = section(doc, y, 'What this means');
  y += 4;

  // Consumption band, as a five-step gauge with a marker at this machine.
  const gaugeW = CONTENT_W;
  CONSUMPTION_TIERS.forEach((t, i) => {
    const left = M + (tierPosition(t.from) / 100) * gaugeW;
    const right = M + (tierPosition(t.to ?? 1000) / 100) * gaugeW;
    doc.setFillColor(250 - i * 9, 232 - i * 24, 230 - i * 24);
    doc.rect(left, y, Math.max(1, right - left - 1), 8, 'F');
  });
  const markerX = M + (tierPosition(avgW) / 100) * gaugeW;
  doc.setFillColor(...BRAND);
  doc.rect(markerX - 1.5, y - 2, 3, 12, 'F');
  y += 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(
    pdfText(`${tier.label} - ${pdfNum(avgW)} W average, ${pdfKwh(report.totals.yearly.kwh)} a year`),
    M,
    y,
  );
  y += 11;
  y = paragraph(doc, y, tier.blurb);

  if (report.suggestedCategory) {
    y += 2;
    y = paragraph(
      doc,
      y,
      `Looks like: ${report.suggestedCategory.label} - ${report.suggestedCategory.reason}`,
      { bold: true, color: INK },
    );
  }

  y += 4;
  y += kvRows(
    doc,
    y,
    carrier.map((e) => ({ k: e.sentence, v: `${e.value} ${e.unit}` })),
  );
  y += 6;
  y = paragraph(
    doc,
    y,
    'These are unit conversions of the annual kWh figure, not measurements: coal at 24 MJ/kg and 35% plant efficiency (0.43 kg/kWh), gas at 36 MJ/m3 and 55% CCGT (0.18 m3/kWh), diesel at 38.6 MJ/L and 35% genset (0.27 L/kWh), cooling water 1.8 L/kWh, solar 1,400 kWh per kWp per year.',
    { size: 7.5 },
  );

  // ── Measured vs estimated
  const measured = report.measured;
  const hasMeasured =
    measured != null && (measured.idle_w || measured.load_w || measured.avg_w);
  y = ensureSpace(doc, y + 6, 90);
  y = section(doc, y, 'Estimated versus measured');
  if (hasMeasured) {
    const rows: Array<[string, number, number]> = [];
    if (measured?.idle_w) rows.push(['Idle draw (wall)', report.idleWallW, measured.idle_w]);
    if (measured?.load_w) rows.push(['Full load (wall)', psu.peakWallW, measured.load_w]);
    if (measured?.avg_w) {
      const modelAvg = report.totals.daily.kwh > 0 ? (report.totals.daily.kwh * 1000) / 24 : 0;
      rows.push(['Daily average (wall)', modelAvg, measured.avg_w]);
    }
    y += kvRows(
      doc,
      y,
      rows.map(([k, model, real]) => {
        const delta = model > 0 ? Math.round(((real - model) / model) * 100) : 0;
        return {
          k: `${k} — model ${pdfNum(model)} W`,
          v: `${pdfNum(real)} W (${delta > 0 ? '+' : ''}${delta}%)`,
          color: Math.abs(delta) > 20 ? RED : GREEN,
        };
      }),
    );
    y += 6;
    y = paragraph(
      doc,
      y,
      'Your meter is the authoritative figure. A gap above 20% usually means one of: unbooked hours the machine is actually on, a part drawing more than its rating, or a supply running outside its efficiency sweet spot.',
    );
  } else {
    y = paragraph(
      doc,
      y,
      'No meter readings were entered for this build. Add a smart-plug reading in the calculator (How accurate is this?) and this section will show the model against reality, reading by reading.',
    );
  }

  footers(doc, date, reportId, disclaimer);

  doc.save(`CI_PC-Power_${slugify(report.buildName)}_${new Date().toISOString().slice(0, 10)}_${reportId}.pdf`);
}
