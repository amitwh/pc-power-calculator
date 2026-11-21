import type { BuildCategory, MeasuredReadings } from '@/types/build';
import type { ComponentCategory } from '@/types/component';
import type { CurrencyInfo } from '@/types/currency';
import { formatCost } from '@/lib/calc/format';
import { CATEGORY_LABEL as BUILD_CATEGORY_LABEL, labelFor } from '@/lib/buildCategory';

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

/**
 * The estimate caveat printed in every export. Defined once so the PDF and the
 * HTML report cannot drift apart.
 */
export const REPORT_DISCLAIMER =
  'Report generated automatically. Estimates are based on configured hardware, workload assumptions and electricity tariffs. Power figures are modelled from rated specifications (or the basis shown), not measured unless labelled Measured. Carbon uses an editable grid factor, not your supplier\'s fuel mix. Verify specifications with the manufacturer and rates with your utility.';

export const CATEGORY_LABEL: Record<ComponentCategory, string> = {
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

export const BASIS_LABEL: Record<PowerBasis, string> = {
  rated: 'Rated',
  measured: 'Measured',
  estimated: 'Estimated',
  unknown: '—',
};

/** Default grid intensity when the caller does not supply one. */
export const DEFAULT_GRID_FACTOR_KG_PER_KWH = 0.71;

/** Currency-formatted amount, exactly as the rest of the app prints money. */
export function money(amount: number, currency: CurrencyInfo): string {
  return formatCost(amount, currency);
}

/** One decimal, Indian grouping — the report's single precision rule. */
export function num(n: number, decimals = 1): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

export function kwh(value: number, decimals = 1): string {
  return `${num(value, decimals)} kWh`;
}

/** Aliases kept so callers written against the old PDF module keep compiling. */
export const pdfNum = num;
export const pdfKwh = kwh;

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

/** Money precision: paise, with floating-point noise rounded away. */
export function roundMoney2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The schedule's annual cost, reconciled to the printed rows.
 *
 * `rows[i]` is the cost shown against `schedule[i]`; `yearly` is the sum of
 * those printed rows, so a reader adding the column up lands on the total the
 * report prints.
 */
export function reconciledTotals(report: PdfReport): { rows: number[]; yearly: number } {
  const rows = report.schedule.map((row) => roundMoney2(row.costYear));
  const yearly = roundMoney2(rows.reduce((acc, v) => acc + v, 0));
  return { rows, yearly };
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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'build';
}

/**
 * The saved file name for a report. Shared by the PDF and HTML exports so the
 * two never disagree about slug, date or report ID.
 */
export function reportFileName(report: PdfReport, ext: 'pdf' | 'html', now = new Date()): string {
  // IST, not UTC: between 00:00 and 05:30 IST the UTC date is still yesterday,
  // which would date the file differently from the report ID inside it.
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  const date = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(
    ist.getUTCDate(),
  ).padStart(2, '0')}`;
  return `CI_PC-Power_${slugify(report.buildName)}_${date}_${makeReportId(
    report.buildName,
    now,
  )}.${ext}`;
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
 * The human label for a build category id, in the term the industry uses.
 * Unknown ids fall back to the raw string; an absent category reads as a dash.
 */
export function buildCategoryLabel(category?: string): string {
  if (!category) return '—';
  if (!Object.hasOwn(BUILD_CATEGORY_LABEL, category)) return category;
  return labelFor(category as BuildCategory);
}

/**
 * The category label for a device row. Generic case fans are reported as
 * "Case fan" rather than the plural catalog name.
 */
export function deviceCategoryLabel(row: PdfDeviceRow): string {
  if (row.name.startsWith('Generic Case fans')) return 'Case fan';
  return CATEGORY_LABEL[row.category] ?? row.category;
}
