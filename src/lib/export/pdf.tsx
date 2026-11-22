import { Document, Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import type { ComponentCategory } from '@/types/component';
import type { CurrencyInfo } from '@/types/currency';
import { CALC_ENGINE_VERSION } from '@/lib/calc/version';
import {
  CONSUMPTION_TIERS,
  averageWallW,
  tierFor,
  tierPosition,
} from '@/lib/calc/classify';
import { equivalences } from '@/lib/calc/equivalences';
import { categoryColor } from '@/lib/categoryColors';
import { REPORT_FONT_FAMILIES, registerReportFonts } from '@/lib/export/reportFonts';
import {
  BASIS_LABEL,
  CATEGORY_LABEL,
  DEFAULT_GRID_FACTOR_KG_PER_KWH,
  REPORT_DISCLAIMER,
  buildCategoryLabel,
  certificationLabel,
  deviceCategoryLabel,
  istTimestamp,
  kwh,
  makeReportId,
  money,
  num,
  reconciledTotals,
  reportFileName,
  type PdfReport,
} from '@/lib/export/report';

/**
 * Branding assets for the document and the browser download wrapper. Every
 * image is a data URL so the document stays renderable to a buffer; a missing
 * value falls back to the text wordmark or drops the block entirely.
 */
export interface ExportPdfOptions {
  qrDataUrl?: string;
  shareUrl?: string | null;
  logoDataUrl?: string | null;
  watermarkDataUrl?: string | null;
}

interface ReportDocumentProps extends ExportPdfOptions {
  report: PdfReport;
  /** One timestamp for the page, the report ID and the file name. */
  generatedAt?: Date;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 36;
const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2;
/** Rows per table block; each block repeats the header when it paginates. */
const TABLE_CHUNK_ROWS = 18;
const BRAND = '#e5461f';
const INK = '#1a1714';
const MUTED = '#6b625b';
const FAINT = '#8a8078';
const RULE = '#d9d0c9';
const TRACK = '#efe9e4';
const ZEBRA = '#fafbfc';
const AMBER = '#a15c07';
const GREEN = '#1a7a56';
const RED = '#b91c1c';
const USE_CASE_COLOR = '#6a5acd';
const PDF_SOURCE_URL = 'https://pcpower.concreteinfo.net';
/**
 * JetBrains Mono has no rupee glyph, so figures fall back to Inter for ₹ (and
 * any other character the numeric face lacks) while digits stay monospaced.
 */
const NUMERIC_FONT_STACK = [REPORT_FONT_FAMILIES.numeric, REPORT_FONT_FAMILIES.body];
const SHORT_DISCLAIMER =
  'Estimates only: power is modelled from rated specs (or the basis shown), not measured unless labelled, and carbon uses an editable grid factor — not electrical or financial advice.';

const styles = StyleSheet.create({
  page: {
    // Flow content clears the fixed header: logo at top 14 plus 20 pt height,
    // the orange rule at 46, and the first flow element at 60.
    paddingTop: 60,
    paddingHorizontal: PAGE_MARGIN,
    paddingBottom: PAGE_MARGIN,
    fontFamily: REPORT_FONT_FAMILIES.body,
    fontSize: 9,
    color: INK,
    lineHeight: 1.35,
  },
  /**
   * Faint, diagonal brand watermark. A pre-rendered transparent PNG is used
   * rather than a rotated Text: react-pdf's transform pivot shifted rotated
   * text partly off the page. Absolute + fixed keeps it out of the flow, so it
   * repeats on every page without changing pagination.
   */
  watermarkImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    opacity: 1,
  },
  /** The logo's own 2.985:1 ratio, set at a 20 pt print height. */
  headerLogo: {
    position: 'absolute',
    top: 14,
    left: PAGE_MARGIN,
    height: 20,
    width: 60,
  },
  headerWordmark: {
    position: 'absolute',
    top: 16,
    left: PAGE_MARGIN,
    fontSize: 9,
    fontWeight: 700,
    color: BRAND,
    letterSpacing: 1.2,
  },
  headerMetaPrimary: {
    position: 'absolute',
    top: 20,
    right: PAGE_MARGIN,
    fontSize: 8,
    color: MUTED,
    textAlign: 'right',
  },
  headerMetaContinuation: {
    position: 'absolute',
    top: 21,
    right: PAGE_MARGIN,
    fontSize: 7,
    color: FAINT,
    textAlign: 'right',
  },
  headerRule: {
    position: 'absolute',
    top: 46,
    left: PAGE_MARGIN,
    right: PAGE_MARGIN,
    height: 1.2,
    backgroundColor: BRAND,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: INK,
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 9.5,
    color: MUTED,
    marginTop: 6,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  metaCell: {
    width: '25%',
    paddingRight: 8,
    paddingTop: 6,
  },
  metaKey: {
    fontSize: 7,
    color: FAINT,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 700,
    color: INK,
    marginTop: 2,
  },
  section: {
    marginTop: 10,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: 700,
    color: INK,
    borderTopWidth: 0.9,
    borderTopColor: BRAND,
    paddingTop: 5,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  paragraph: {
    fontSize: 9.5,
    color: '#4a443f',
    lineHeight: 1.45,
  },
  heroLabel: {
    fontSize: 8.4,
    fontWeight: 700,
    color: FAINT,
    letterSpacing: 0.8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  heroAmountLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroAmount: {
    fontFamily: NUMERIC_FONT_STACK,
    fontSize: 32,
    fontWeight: 700,
    color: BRAND,
    lineHeight: 1.1,
  },
  heroPer: {
    fontSize: 10,
    color: MUTED,
    marginLeft: 6,
    marginBottom: 3,
  },
  factsRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  factCell: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  factKey: {
    fontSize: 7.2,
    fontWeight: 700,
    color: FAINT,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  factValue: {
    fontFamily: NUMERIC_FONT_STACK,
    fontSize: 11,
    fontWeight: 700,
    color: INK,
    marginTop: 1,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  barLabel: {
    width: 92,
    fontSize: 9.5,
    color: INK,
  },
  barTrack: {
    width: 290,
    height: 8,
    backgroundColor: TRACK,
    borderRadius: 3,
    marginHorizontal: 8,
  },
  barFill: {
    height: 8,
    borderRadius: 3,
  },
  barReadout: {
    // Slightly wider than the proportional setting: the monospaced figures
    // are wider, and this keeps "₹1,00,000.00 · 635.9 kWh" on one line.
    width: 124,
    fontFamily: NUMERIC_FONT_STACK,
    fontSize: 8.4,
    color: '#4a443f',
    textAlign: 'right',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepNum: {
    width: 16,
    fontSize: 9.5,
    fontWeight: 700,
    color: BRAND,
  },
  stepText: {
    flex: 1,
    fontSize: 9.5,
    color: '#4a443f',
    lineHeight: 1.45,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tableHeaderCell: {
    color: '#ffffff',
    fontSize: 7.2,
    fontWeight: 700,
    letterSpacing: 0.3,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
  },
  tableRowAlt: {
    backgroundColor: ZEBRA,
  },
  tableCell: {
    fontSize: 7.6,
    color: INK,
    paddingVertical: 3.2,
    paddingHorizontal: 4,
  },
  tableCellNumeric: {
    fontFamily: NUMERIC_FONT_STACK,
    textAlign: 'right',
  },
  tableCellRight: {
    textAlign: 'right',
  },
  tableFootRow: {
    flexDirection: 'row',
    backgroundColor: '#f6f1ed',
    borderTopWidth: 0.7,
    borderTopColor: BRAND,
    borderBottomWidth: 0.7,
    borderBottomColor: BRAND,
  },
  tableFootCell: {
    fontSize: 7.6,
    fontWeight: 700,
    color: INK,
    paddingVertical: 4.5,
    paddingHorizontal: 4,
  },
  colDevice: {
    flex: 1,
  },
  colCategory: {
    width: 90,
  },
  colQty: {
    width: 34,
  },
  colUnit: {
    width: 62,
  },
  colTotal: {
    width: 62,
  },
  colBasis: {
    width: 64,
  },
  warningBox: {
    marginTop: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  warningText: {
    fontSize: 8.5,
    fontWeight: 700,
    color: RED,
  },
  emphasis: {
    color: BRAND,
  },
  gauge: {
    height: 12,
    marginTop: 6,
    marginBottom: 5,
  },
  gaugeSegment: {
    position: 'absolute',
    top: 2,
    height: 8,
    borderRadius: 3,
  },
  gaugeMarker: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: BRAND,
  },
  tierLine: {
    fontSize: 9.5,
    fontWeight: 700,
    color: INK,
  },
  suggestionLine: {
    fontSize: 9.5,
    fontWeight: 700,
    color: INK,
    marginTop: 5,
  },
  equivalenceSentence: {
    flex: 1,
    marginRight: 14,
  },
  footnote: {
    fontSize: 7.5,
    color: '#4a443f',
    lineHeight: 1.4,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingVertical: 5,
  },
  kvKey: {
    fontSize: 9.5,
    color: '#4a443f',
  },
  kvValue: {
    fontFamily: NUMERIC_FONT_STACK,
    fontSize: 10,
    fontWeight: 700,
    color: INK,
  },
  kvLabelWord: {
    fontFamily: REPORT_FONT_FAMILIES.body,
  },
  qrCard: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf4ef',
    borderRadius: 3,
    padding: 10,
  },
  qrImage: {
    width: 72,
    height: 72,
  },
  qrCopy: {
    flex: 1,
    marginLeft: 12,
  },
  qrCaption: {
    fontSize: 10,
    fontWeight: 700,
    color: INK,
  },
  qrUrl: {
    fontSize: 7.5,
    color: BRAND,
    marginTop: 3,
  },
  qrHint: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 2,
  },
  footerRule: {
    position: 'absolute',
    top: A4_HEIGHT - PAGE_MARGIN,
    left: PAGE_MARGIN,
    right: PAGE_MARGIN,
    height: 0.7,
    backgroundColor: RULE,
  },
  footerAttribution: {
    position: 'absolute',
    top: A4_HEIGHT - PAGE_MARGIN + 1,
    left: PAGE_MARGIN,
  },
  footerPageNumber: {
    fontFamily: NUMERIC_FONT_STACK,
    position: 'absolute',
    top: A4_HEIGHT - PAGE_MARGIN + 1,
    right: PAGE_MARGIN,
    textAlign: 'right',
  },
  footerSite: {
    position: 'absolute',
    top: A4_HEIGHT - PAGE_MARGIN + 11,
    left: PAGE_MARGIN,
  },
  footerReportId: {
    position: 'absolute',
    top: A4_HEIGHT - PAGE_MARGIN + 11,
    right: PAGE_MARGIN,
    textAlign: 'right',
  },
  footerDisclaimer: {
    position: 'absolute',
    top: A4_HEIGHT - PAGE_MARGIN + 21,
    left: PAGE_MARGIN,
    right: PAGE_MARGIN,
    fontSize: 6,
    color: FAINT,
  },
  footerStrong: {
    fontSize: 7.2,
    fontWeight: 700,
    color: INK,
  },
  footerMuted: {
    fontSize: 6.4,
    color: MUTED,
  },
  footerLink: {
    fontSize: 6.4,
    color: BRAND,
    textDecoration: 'none',
  },
});

/** A number on the page is either finite or an em dash, never NaN. */
function safeWatts(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${num(value)} W` : '—';
}

function safeMoney(amount: number, currency: CurrencyInfo): string {
  return Number.isFinite(amount) ? money(amount, currency) : '—';
}

function safeKwh(value: number): string {
  return Number.isFinite(value) ? kwh(value) : '—';
}

/**
 * The share URL printed under the QR. A full build token can be hundreds of
 * characters; printing it wraps the card over half a page and pushes the
 * closing sections onto an otherwise blank page. The QR carries the full URL,
 * so the caption only needs enough to recognise it.
 */
function displayShareUrl(url: string): string {
  if (url.length <= 64) return url;
  try {
    const parsed = new URL(url);
    const token = parsed.pathname.replace(/^\/build\//, '');
    return `${parsed.host}/build/…${token.slice(-8)}`;
  } catch {
    return `${url.slice(0, 61)}…`;
  }
}

/** Brand colour blended into white, lightest band first, for the gauge. */
function gaugeColor(index: number): string {
  const alpha = 0.08 + index * 0.13;
  const channel = (base: number, target: number) =>
    Math.round(base + (target - base) * alpha)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(255, 229)}${channel(255, 70)}${channel(255, 31)}`;
}

const METHOD_STEPS = [
  'Component draw: each part contributes its rated wattage, or the basis shown in the component table. Overclocking adds a percentage on top of the CPU and GPU figures.',
  'Workload draw: each use case applies a utilisation factor to those components — office and browsing run a fraction of full load, gaming and rendering run close to it.',
  'Idle draw: a small fixed share of each component for the hours the machine is on but not working.',
  "PSU conversion: component draw is divided by the supply's efficiency at that load, giving the wall figure the meter sees.",
  'Energy: wall watts × hours per day × days per week, summed across use cases and idle, then annualised.',
  'Cost: energy is priced through the regional tariff, including slab tiers and taxes where the tariff data provides them.',
];

/**
 * The report as a flow-laid-out react-pdf document.
 *
 * Pure in the rendering sense: no fetching, font registration or browser APIs,
 * so it can be rendered to a buffer in tests and to a blob in the browser.
 */
export function ReportDocument({
  report,
  generatedAt,
  qrDataUrl,
  shareUrl,
  logoDataUrl,
  watermarkDataUrl,
}: ReportDocumentProps) {
  const now = generatedAt ?? new Date();
  const reportId = makeReportId(report.buildName, now);
  const generated = `${istTimestamp(now)} IST`;
  const reconciled = reconciledTotals(report);
  const averageW = averageWallW(report.totals.yearly.kwh);
  const tier = tierFor(Number.isFinite(averageW) ? averageW : 0);
  const psu = report.psu;
  const additionalCapacity = psu.ratedW != null ? psu.ratedW - psu.recommendedW : null;
  const gridFactor = report.gridFactorKgPerKwh ?? DEFAULT_GRID_FACTOR_KG_PER_KWH;
  const co2kg = report.totals.yearly.kwh * gridFactor;
  const gaugeMarkerLeft =
    (tierPosition(Number.isFinite(averageW) ? averageW : 0) / 100) * CONTENT_WIDTH;

  // The table is chunked rather than left to the layout engine: each block is
  // kept whole and repeats the header, so a split never orphans a header row.
  const tableDevices = report.devices.filter((device) => device.category !== 'psu');
  const deviceChunks: Array<typeof tableDevices> = [];
  for (let i = 0; i < tableDevices.length; i += TABLE_CHUNK_ROWS) {
    deviceChunks.push(tableDevices.slice(i, i + TABLE_CHUNK_ROWS));
  }

  // Six equivalences, chosen exactly as the old renderer chose them: one carbon,
  // three fuel, one water and one everyday figure.
  const allEquivalences = equivalences(report.totals.yearly.kwh, co2kg);
  const equivalenceRows = [
    ...allEquivalences.filter((item) => item.group === 'carbon').slice(0, 1),
    ...allEquivalences.filter((item) => item.group === 'fuel').slice(0, 3),
    ...allEquivalences.filter((item) => item.group === 'water').slice(0, 1),
    ...allEquivalences.filter((item) => item.group === 'everyday').slice(0, 1),
  ];

  const measured = report.measured;
  const hasMeasured =
    measured != null && Boolean(measured.idle_w || measured.load_w || measured.avg_w);
  const measuredRows: Array<{ label: string; model: number; real: number }> = [];
  if (measured?.idle_w) {
    measuredRows.push({ label: 'Idle draw (wall)', model: report.idleWallW, real: measured.idle_w });
  }
  if (measured?.load_w) {
    measuredRows.push({ label: 'Full load (wall)', model: psu.peakWallW, real: measured.load_w });
  }
  if (measured?.avg_w) {
    const modelAvg = report.totals.daily.kwh > 0 ? (report.totals.daily.kwh * 1000) / 24 : 0;
    measuredRows.push({ label: 'Daily average (wall)', model: modelAvg, real: measured.avg_w });
  }

  const meta: Array<[string, string]> = [
    ['Report ID', reportId],
    ['Generated', generated],
    ['System', report.buildName],
    ['Location', report.locationLabel || '—'],
    ['Tariff currency', `${report.currency.code} (${report.currency.symbol.trim()})`],
    ['Engine', `v${CALC_ENGINE_VERSION}`],
    [
      'Tariff source',
      `${report.tariffSource ?? 'Compiled'}${
        report.tariffVerifiedAt ? ` · ${report.tariffVerifiedAt}` : ''
      }`,
    ],
    ['Catalog data verified', report.catalogVerifiedAt ?? '—'],
  ];

  // Power by component category. The PSU converts power rather than consuming
  // it, so it is excluded from the breakdown.
  const byCategory = new Map<ComponentCategory, number>();
  for (const device of report.devices) {
    if (device.category === 'psu') continue;
    const unitW =
      typeof device.unitW === 'number' && Number.isFinite(device.unitW) ? device.unitW : 0;
    const qty = Number.isFinite(device.qty) ? device.qty : 0;
    byCategory.set(device.category, (byCategory.get(device.category) ?? 0) + unitW * qty);
  }
  const totalComponentW = [...byCategory.values()].reduce((acc, value) => acc + value, 0);
  const powerRows = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, watts]) => ({
      category,
      watts,
      hex: categoryColor(category).hex,
      pct: totalComponentW > 0 ? Math.round((watts / totalComponentW) * 100) : 0,
    }));

  // Cost by use case. `reconciled.rows` is printed beside the same-index
  // schedule row, so the column and the total agree to the paisa.
  const costRows = report.schedule
    .map((row, index) => {
      const printedCost = reconciled.rows[index] ?? 0;
      return {
        name: row.name,
        printedCost,
        cost: Number.isFinite(printedCost) ? printedCost : 0,
        kwhYear: row.kwhYear,
      };
    })
    .sort((a, b) => b.cost - a.cost);
  const maxCost = Math.max(...costRows.map((row) => row.cost), 1);

  return (
    <Document
      title={`${report.buildName} - PC Power Calculator report`}
      author="PC Power Calculator (ConcreteInfo)"
      creator="PC Power Calculator"
      subject="PC energy, cost, carbon and PSU sizing estimate"
      keywords="PC power, electricity cost, energy audit, PSU sizing, carbon footprint"
    >
      <Page size="A4" style={styles.page}>
        {watermarkDataUrl ? (
          <Image fixed src={watermarkDataUrl} style={styles.watermarkImage} />
        ) : null}
        {/* One fixed header on every page: the logo on white, the page-1
            identity, the build identity on later pages, and the brand rule.
            The logo and the metadata are separate fixed elements on purpose:
            a fixed View returning text loses it from the page in this version. */}
        {logoDataUrl ? (
          <Image fixed src={logoDataUrl} style={styles.headerLogo} />
        ) : (
          <Text fixed style={styles.headerWordmark}>PC POWER CALCULATOR</Text>
        )}
        <Text
          fixed
          style={styles.headerMetaPrimary}
          render={({ pageNumber }) =>
            pageNumber === 1 ? `${report.currency.code} report · ${generated}` : ''
          }
        />
        <Text
          fixed
          style={styles.headerMetaContinuation}
          render={({ pageNumber }) =>
            pageNumber > 1 ? `${report.buildName} · ${reportId}` : ''
          }
        />
        <View fixed style={styles.headerRule} />

        {/* Cover identity and provenance, in the flow below the header. */}
        <View wrap={false}>
          <Text style={styles.title}>{report.buildName}</Text>
          <Text style={styles.subtitle}>
            {[buildCategoryLabel(report.buildCategory), report.locationLabel, report.tariffLabel]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>

          <View style={styles.metaGrid}>
            {meta.map(([key, value]) => (
              <View key={key} style={styles.metaCell}>
                <Text style={styles.metaKey}>{key}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Hero: the annual cost, with the monthly, daily and energy facts. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.heroLabel}>ESTIMATED ANNUAL RUNNING COST</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroAmountLine}>
              <Text style={styles.heroAmount}>
                {safeMoney(reconciled.yearly, report.currency)}
              </Text>
              <Text style={styles.heroPer}>per year</Text>
            </View>
            <View style={styles.factsRow}>
              <View style={styles.factCell}>
                <Text style={styles.factKey}>Per month</Text>
                <Text style={styles.factValue}>
                  {safeMoney(report.totals.monthly.cost, report.currency)}
                </Text>
              </View>
              <View style={styles.factCell}>
                <Text style={styles.factKey}>Per day</Text>
                <Text style={styles.factValue}>
                  {safeMoney(report.totals.daily.cost, report.currency)}
                </Text>
              </View>
              <View style={styles.factCell}>
                <Text style={styles.factKey}>Energy / year</Text>
                <Text style={styles.factValue}>{safeKwh(report.totals.yearly.kwh)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Where the power goes, by component category. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>Where the power goes</Text>
          <Text style={styles.paragraph}>
            {`Share of the ${num(totalComponentW)} W estimated typical component draw, by part category. The PSU is excluded: it converts power rather than consuming it.`}
          </Text>
          {powerRows.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              {powerRows.map((row) => (
                <View key={row.category} style={styles.barRow}>
                  <Text style={styles.barLabel}>{CATEGORY_LABEL[row.category]}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.max(row.pct, 1)}%` as `${number}%`,
                          backgroundColor: row.hex,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barReadout}>
                    {`${num(row.watts)} W · ${row.pct}%`}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.paragraph, { marginTop: 4 }]}>No components selected.</Text>
          )}
        </View>

        {/* Cost by use case. Omitted entirely when no schedule was entered. */}
        {costRows.length > 0 ? (
          <View wrap={false} style={styles.section}>
            <Text style={styles.sectionHeading}>What each use case costs</Text>
            <Text style={styles.paragraph}>
              {`Bars are scaled to the largest single use case (${safeMoney(
                maxCost,
                report.currency,
              )}). The schedule totals ${safeMoney(reconciled.yearly, report.currency)} a year.`}
            </Text>
            <View style={{ marginTop: 6 }}>
              {costRows.map((row, index) => {
                const pct = Math.round((row.cost / maxCost) * 100);
                return (
                  <View key={`${row.name}-${index}`} style={styles.barRow}>
                    <Text style={styles.barLabel}>{row.name}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${Math.max(pct, 1)}%` as `${number}%`,
                            backgroundColor: USE_CASE_COLOR,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barReadout}>
                      {`${safeMoney(row.printedCost, report.currency)} · ${safeKwh(row.kwhYear)}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Method: kept beside the figures so the numbers stay auditable. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>How these figures are calculated</Text>
          {METHOD_STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <Text style={styles.stepNum}>{`${index + 1}.`}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <Text style={[styles.paragraph, { marginTop: 4, fontSize: 8.4 }]}>
            {report.tariffEstimated
              ? `* The tariff used is an estimated rate (${report.tariffSource ?? 'compiled band'}), not a verified bill for a specific distributor. Override it with your own rate for an exact figure.`
              : `Tariff source: ${report.tariffSource ?? 'compiled published tariffs'}, ${
                  report.tariffVerifiedAt ?? 'date not recorded'
                }.`}
          </Text>
        </View>

        {/* Idle, typical and maximum. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>Idle, typical and maximum</Text>
          <View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Idle (on, nothing running — wall)</Text>
              <Text style={styles.kvValue}>{safeWatts(report.idleWallW)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Typical (components at rated draw — DC)</Text>
              <Text style={styles.kvValue}>{safeWatts(report.typicalComponentW)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Maximum (all components at 100% — wall)</Text>
              <Text style={styles.kvValue}>{safeWatts(report.psu.peakWallW)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Consumption band (average over 8,760 hours)</Text>
              <Text style={styles.kvValue}>
                <Text style={styles.kvLabelWord}>{`${tier.label} · `}</Text>
                {Number.isFinite(averageW) ? `${num(averageW)} W` : '—'}
              </Text>
            </View>
          </View>
          <Text style={[styles.paragraph, { marginTop: 4 }]}>{tier.blurb}</Text>
          <Text style={[styles.paragraph, { marginTop: 5 }]}>
            Idle is the figure that decides a 24×7 NAS or server bill: it runs every hour the
            machine is on. A machine that idles 100 W for 20 hours costs more than one that peaks
            at 400 W for two.
          </Text>
        </View>

        {/* Components table, chunked so every page of it repeats the header. */}
        <View>
          {deviceChunks.length > 0 ? (
            deviceChunks.map((chunk, chunkIndex) => (
              <View
                key={`devices-${chunkIndex}`}
                wrap={false}
                style={chunkIndex === 0 ? styles.section : undefined}
              >
                {chunkIndex === 0 ? (
                  <Text style={styles.sectionHeading}>Components</Text>
                ) : null}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, styles.colDevice]}>Device</Text>
                  <Text style={[styles.tableHeaderCell, styles.colCategory]}>Category</Text>
                  <Text
                    style={[styles.tableHeaderCell, styles.colQty, styles.tableCellRight]}
                  >
                    Qty
                  </Text>
                  <Text
                    style={[styles.tableHeaderCell, styles.colUnit, styles.tableCellRight]}
                  >
                    W per unit
                  </Text>
                  <Text
                    style={[styles.tableHeaderCell, styles.colTotal, styles.tableCellRight]}
                  >
                    Total W
                  </Text>
                  <Text
                    style={[styles.tableHeaderCell, styles.colBasis, styles.tableCellRight]}
                  >
                    Basis
                  </Text>
                </View>
                {chunk.map((row, rowIndex) => {
                  const unitW =
                    typeof row.unitW === 'number' && Number.isFinite(row.unitW)
                      ? row.unitW
                      : null;
                  return (
                    <View
                      key={`${row.name}-${rowIndex}`}
                      style={[styles.tableRow, rowIndex % 2 === 1 ? styles.tableRowAlt : {}]}
                    >
                      <Text style={[styles.tableCell, styles.colDevice]}>{row.name}</Text>
                      <Text style={[styles.tableCell, styles.colCategory]}>
                        {deviceCategoryLabel(row)}
                      </Text>
                      <Text
                        style={[styles.tableCell, styles.tableCellNumeric, styles.colQty]}
                      >
                        {Number.isFinite(row.qty) ? String(row.qty) : '—'}
                      </Text>
                      <Text
                        style={[styles.tableCell, styles.tableCellNumeric, styles.colUnit]}
                      >
                        {unitW != null ? num(unitW) : '—'}
                      </Text>
                      <Text
                        style={[styles.tableCell, styles.tableCellNumeric, styles.colTotal]}
                      >
                        {unitW != null ? num(row.totalW) : '—'}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellRight,
                          styles.colBasis,
                          row.basis === 'estimated'
                            ? { color: AMBER }
                            : row.basis === 'measured'
                              ? { color: GREEN }
                              : {},
                        ]}
                      >
                        {BASIS_LABEL[row.basis]}
                      </Text>
                    </View>
                  );
                })}
                {chunkIndex === deviceChunks.length - 1 ? (
                  <View style={styles.tableFootRow}>
                    <Text style={[styles.tableFootCell, styles.colDevice]}>
                      Estimated typical component draw (DC)
                    </Text>
                    <Text style={[styles.tableFootCell, styles.colCategory]} />
                    <Text style={[styles.tableFootCell, styles.colQty]} />
                    <Text style={[styles.tableFootCell, styles.colUnit]} />
                    <Text
                      style={[
                        styles.tableFootCell,
                        styles.tableCellRight,
                        styles.colTotal,
                      ]}
                    >
                      {num(report.typicalComponentW)}
                    </Text>
                    <Text style={[styles.tableFootCell, styles.colBasis]} />
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <View wrap={false} style={styles.section}>
              <Text style={styles.sectionHeading}>Components</Text>
              <Text style={styles.paragraph}>No components selected.</Text>
            </View>
          )}
          <Text style={[styles.paragraph, { marginTop: 6 }]}>
            Rated = the manufacturer&apos;s published figure. Measured = from independent
            testing. Estimated = derived by the calculator where no figure was published. These
            are component (DC) figures, before power-supply conversion.
          </Text>
        </View>

        {/* Power supply sizing and conversion losses. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>Power supply</Text>
          <View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Estimated typical component draw (DC)</Text>
              <Text style={styles.kvValue}>{safeWatts(report.typicalComponentW)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Estimated maximum system draw (wall, AC)</Text>
              <Text style={styles.kvValue}>{safeWatts(psu.peakWallW)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Recommended PSU capacity</Text>
              <Text style={[styles.kvValue, styles.emphasis]}>
                {`${num(psu.recommendedW, 0)} W`}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Installed PSU capacity</Text>
              <Text style={styles.kvValue}>
                {psu.ratedW != null ? `${num(psu.ratedW, 0)} W` : 'Not selected'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Additional capacity</Text>
              <Text
                style={[
                  styles.kvValue,
                  additionalCapacity == null
                    ? {}
                    : { color: additionalCapacity < 0 ? RED : GREEN },
                ]}
              >
                {additionalCapacity == null
                  ? '—'
                  : `${additionalCapacity >= 0 ? '+' : ''}${num(additionalCapacity, 0)} W`}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Model / certification</Text>
              <Text style={styles.kvValue}>
                {[psu.name, certificationLabel(psu.certification)].filter(Boolean).join(' · ') ||
                  '—'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Conversion efficiency at this load</Text>
              <Text style={styles.kvValue}>
                {psu.efficiencyAtLoad != null
                  ? `${Math.round(psu.efficiencyAtLoad * 100)}%`
                  : '—'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>UPS conversion efficiency</Text>
              <Text style={styles.kvValue}>
                {report.upsEfficiency && report.upsEfficiency < 1
                  ? `${Math.round(report.upsEfficiency * 100)}%`
                  : 'No UPS in the path'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Peak draw lost to PSU conversion</Text>
              <Text style={styles.kvValue}>
                {psu.efficiencyAtLoad != null
                  ? safeWatts(psu.peakWallW * (1 - psu.efficiencyAtLoad))
                  : '—'}
              </Text>
            </View>
          </View>
          <Text style={[styles.paragraph, { marginTop: 6 }]}>
            The recommendation is a practical PSU size: peak component draw plus 35% headroom for
            transient spikes and capacitor ageing, rounded up to the nearest standard rating — not
            peak draw multiplied by 1.35 exactly. Wall draw is component draw divided by the
            supply&apos;s conversion efficiency at this load (P_wall = P_components / efficiency).
          </Text>
          {psu.ratedW != null && psu.ratedW < psu.recommendedW ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {`Installed supply is ${num(
                  psu.recommendedW - psu.ratedW,
                  0,
                )} W below the recommendation — undersized for sustained full load.`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Carbon footprint at the configured grid factor. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>Carbon footprint</Text>
          <View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Annual energy</Text>
              <Text style={styles.kvValue}>{safeKwh(report.totals.yearly.kwh)}</Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Grid factor used</Text>
              <Text style={styles.kvValue}>
                {Number.isFinite(gridFactor) ? `${num(gridFactor, 2)} kg CO₂e / kWh` : '—'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Estimated annual emissions</Text>
              <Text style={[styles.kvValue, styles.emphasis]}>
                {Number.isFinite(co2kg) ? `${num(co2kg, 1)} kg CO₂e` : '—'}
              </Text>
            </View>
            <View style={styles.kvRow}>
              <Text style={styles.kvKey}>Equivalent</Text>
              <Text style={styles.kvValue}>
                {Number.isFinite(co2kg)
                  ? `${num((co2kg * 5) / 1000, 2)} tonnes over 5 years at this usage`
                  : '—'}
              </Text>
            </View>
          </View>
          <Text style={[styles.paragraph, { marginTop: 6 }]}>
            A grid factor is an average, not a promise: it varies by state, season and time of
            day, and a supplier&apos;s published fuel mix will differ from it. Change the factor to
            your own supplier or state figure before quoting this number.
          </Text>
        </View>

        {/* Consumption band, what it looks like it is for, and equivalences. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>What this means</Text>
          <View style={styles.gauge}>
            {CONSUMPTION_TIERS.map((band, index) => (
              <View
                key={band.key}
                style={[
                  styles.gaugeSegment,
                  {
                    left: (tierPosition(band.from) / 100) * CONTENT_WIDTH,
                    width: Math.max(
                      1,
                      ((tierPosition(band.to ?? 1000) - tierPosition(band.from)) / 100) *
                        CONTENT_WIDTH,
                    ),
                    backgroundColor: gaugeColor(index),
                  },
                ]}
              />
            ))}
            <View
              style={[styles.gaugeMarker, { left: Math.max(0, gaugeMarkerLeft - 1.5) }]}
            />
          </View>
          <Text style={styles.tierLine}>
            {`${tier.label} — ${
              Number.isFinite(averageW) ? `${num(averageW)} W` : '—'
            } average, ${safeKwh(report.totals.yearly.kwh)} a year`}
          </Text>
          <Text style={[styles.paragraph, { marginTop: 3 }]}>{tier.blurb}</Text>
          {report.suggestedCategory ? (
            <Text style={styles.suggestionLine}>
              {`Looks like: ${report.suggestedCategory.label} — ${report.suggestedCategory.reason}`}
            </Text>
          ) : null}
          {equivalenceRows.length > 0 ? (
            <View style={{ marginTop: 7 }}>
              {equivalenceRows.map((item) => (
                <View key={item.key} style={styles.kvRow}>
                  <Text style={[styles.kvKey, styles.equivalenceSentence]}>
                    {item.sentence}
                  </Text>
                  <Text style={styles.kvValue}>{`${item.value} ${item.unit}`}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={[styles.footnote, { marginTop: 6 }]}>
            These are unit conversions of the annual kWh figure, not measurements: coal at 24
            MJ/kg and 35% plant efficiency (0.43 kg/kWh), gas at 36 MJ/m3 and 55% CCGT (0.18
            m3/kWh), diesel at 38.6 MJ/L and 35% genset (0.27 L/kWh), cooling water 1.8 L/kWh,
            solar 1,400 kWh per kWp per year.
          </Text>
        </View>

        {/* Model versus the owner's own meter readings. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>Estimated versus measured</Text>
          {hasMeasured ? (
            <View>
              {measuredRows.map(({ label, model, real }) => {
                const delta = model > 0 ? Math.round(((real - model) / model) * 100) : 0;
                return (
                  <View key={label} style={styles.kvRow}>
                    <Text style={styles.kvKey}>{`${label} — model ${num(model)} W`}</Text>
                    <Text
                      style={[
                        styles.kvValue,
                        { color: Math.abs(delta) > 20 ? RED : GREEN },
                      ]}
                    >
                      {`${num(real)} W (${delta > 0 ? '+' : ''}${delta}%)`}
                    </Text>
                  </View>
                );
              })}
              <Text style={[styles.paragraph, { marginTop: 6 }]}>
                Your meter is the authoritative figure. A gap above 20% usually means one of:
                unbooked hours the machine is actually on, a part drawing more than its rating, or
                a supply running outside its efficiency sweet spot.
              </Text>
            </View>
          ) : (
            <Text style={styles.paragraph}>
              No meter readings were entered for this build. Add a smart-plug reading in the
              calculator (How accurate is this?) and this section will show the model against
              reality, reading by reading.
            </Text>
          )}
        </View>

        {/* Scan-to-open permalink. Dropped entirely when the build has no share
            URL or the QR would push past the 6 KB link cap. */}
        {shareUrl && qrDataUrl ? (
          <View wrap={false} style={styles.qrCard}>
            <Image src={qrDataUrl} style={styles.qrImage} />
            <View style={styles.qrCopy}>
              <Text style={styles.qrCaption}>Scan to open this build</Text>
              <Text style={styles.qrUrl}>{displayShareUrl(shareUrl)}</Text>
              <Text style={styles.qrHint}>
                Opens the live calculator with every part and hour pre-filled.
              </Text>
            </View>
          </View>
        ) : null}

        {/* The full caveat, in the flow; the footer keeps the one-line version. */}
        <View wrap={false} style={styles.section}>
          <Text style={styles.sectionHeading}>Disclaimer</Text>
          <Text style={styles.footnote}>{REPORT_DISCLAIMER}</Text>
        </View>

        {/* Footer repeats on every page: attribution, traceability and caveat.
            Each line is its own fixed element; a single multi-row fixed View
            loses its first row when the flow document spans pages. */}
        <View fixed style={styles.footerRule} />
        <Text fixed style={[styles.footerStrong, styles.footerAttribution]}>
          {'Generated by PC Power Calculator · A ConcreteInfo product'}
        </Text>
        <Text
          fixed
          style={[styles.footerStrong, styles.footerPageNumber]}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
        <Link fixed src={PDF_SOURCE_URL} style={[styles.footerLink, styles.footerSite]}>
          pcpower.concreteinfo.net
        </Link>
        <Text fixed style={[styles.footerMuted, styles.footerReportId]}>
          {`Report ID ${reportId} · ${generated}`}
        </Text>
        <Text fixed style={styles.footerDisclaimer}>
          {SHORT_DISCLAIMER}
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Render the report in the browser and download it under the shared file name.
 *
 * react-pdf is imported dynamically so the renderer stays out of the initial
 * app bundle and only loads when someone exports a report.
 */
export async function exportPdf(report: PdfReport, opts: ExportPdfOptions = {}): Promise<void> {
  const now = new Date();
  registerReportFonts('/fonts/report');
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<ReportDocument report={report} generatedAt={now} {...opts} />).toBlob();

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = reportFileName(report, 'pdf', now);
  anchor.click();
  URL.revokeObjectURL(url);
}
