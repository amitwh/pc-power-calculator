import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer';
import type { ComponentCategory } from '@/types/component';
import type { CurrencyInfo } from '@/types/currency';
import { CALC_ENGINE_VERSION } from '@/lib/calc/version';
import { averageWallW, tierFor } from '@/lib/calc/classify';
import { categoryColor } from '@/lib/categoryColors';
import { REPORT_FONT_FAMILIES, registerReportFonts } from '@/lib/export/reportFonts';
import {
  CATEGORY_LABEL,
  buildCategoryLabel,
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
 * Options shared by the document and the browser download wrapper. The QR and
 * logo are accepted now so later tasks can add them without changing callers.
 */
export interface ExportPdfOptions {
  qrDataUrl?: string;
  shareUrl?: string | null;
  logoDataUrl?: string | null;
}

interface ReportDocumentProps extends ExportPdfOptions {
  report: PdfReport;
  /** One timestamp for the page, the report ID and the file name. */
  generatedAt?: Date;
}

const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 36;
const BRAND = '#e5461f';
const INK = '#1a1714';
const MUTED = '#6b625b';
const FAINT = '#8a8078';
const RULE = '#d9d0c9';
const TRACK = '#efe9e4';
const USE_CASE_COLOR = '#6a5acd';
const PDF_SOURCE_URL = 'https://pcpower.concreteinfo.co.in';
/**
 * JetBrains Mono has no rupee glyph, so figures fall back to Inter for ₹ (and
 * any other character the numeric face lacks) while digits stay monospaced.
 */
const NUMERIC_FONT_STACK = [REPORT_FONT_FAMILIES.numeric, REPORT_FONT_FAMILIES.body];
const SHORT_DISCLAIMER =
  'Estimates only: power is modelled from rated specs (or the basis shown), not measured unless labelled, and carbon uses an editable grid factor — not electrical or financial advice.';

const styles = StyleSheet.create({
  page: {
    padding: PAGE_MARGIN,
    fontFamily: REPORT_FONT_FAMILIES.body,
    fontSize: 9,
    color: INK,
    lineHeight: 1.35,
  },
  brandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 2,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  brandBarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.2,
  },
  brandBarMeta: {
    color: '#ffe4dc',
    fontSize: 8,
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
    marginTop: 22,
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
    marginBottom: 6,
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
  continuationHeader: {
    position: 'absolute',
    top: 12,
    left: PAGE_MARGIN,
    right: PAGE_MARGIN,
    fontSize: 7,
    color: FAINT,
    textAlign: 'right',
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
export function ReportDocument({ report, generatedAt }: ReportDocumentProps) {
  const now = generatedAt ?? new Date();
  const reportId = makeReportId(report.buildName, now);
  const generated = `${istTimestamp(now)} IST`;
  const reconciled = reconciledTotals(report);
  const averageW = averageWallW(report.totals.yearly.kwh);
  const tier = tierFor(Number.isFinite(averageW) ? averageW : 0);

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
        {/* Continued-page header, blank on the cover page. */}
        <Text
          fixed
          style={styles.continuationHeader}
          render={({ pageNumber }) =>
            pageNumber > 1 ? `${report.buildName} · ${reportId}` : ''
          }
        />

        {/* Cover: brand bar, build identity and provenance. */}
        <View wrap={false}>
          <View style={styles.brandBar}>
            <Text style={styles.brandBarText}>PC POWER CALCULATOR</Text>
            <Text style={styles.brandBarMeta}>
              {`${report.currency.code} report · ${generated}`}
            </Text>
          </View>

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
          pcpower.concreteinfo.co.in
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
 * app bundle, mirroring how the old jsPDF export was loaded.
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
