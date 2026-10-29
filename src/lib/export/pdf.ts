import type { ComponentCategory } from '@/types/component';
import type { CurrencyInfo } from '@/types/currency';
import { formatCost } from '@/lib/calc/format';

/** One row in the report's device table (a distinct component + unit count). */
export interface PdfDeviceRow {
  name: string;
  category: ComponentCategory;
  qty: number;
  /** Rated watts per unit after any TDP override / overclock (null = unknown). */
  unitW: number | null;
  totalW: number;
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

export interface PdfReport {
  buildName: string;
  buildCategory?: string;
  locationLabel: string;
  tariffLabel: string;
  currency: CurrencyInfo;
  devices: PdfDeviceRow[];
  peakWallDrawW: number;
  recommendedPsuW: number;
  installedPsuW: number | null;
  schedule: PdfScheduleRow[];
  totals: {
    daily: { kwh: number; cost: number };
    monthly: { kwh: number; cost: number };
    yearly: { kwh: number; cost: number };
  };
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
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

/** Currency-formatted amount safe for the PDF's WinAnsi fonts. */
export function pdfMoney(amount: number, currency: CurrencyInfo): string {
  return pdfText(formatCost(amount, currency));
}

function pdfKwh(kwh: number, decimals = 1): string {
  return `${new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(kwh)} kWh`;
}

const BRAND: [number, number, number] = [0xe5, 0x46, 0x1f];
const INK: [number, number, number] = [0x1f, 0x29, 0x37];
const MUTED: [number, number, number] = [0x6b, 0x72, 0x80];
const RED: [number, number, number] = [0xb9, 0x1c, 0x1c];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'build';
}

/**
 * Generate a formatted PDF report and trigger the browser download.
 * jsPDF + autoTable are dynamically imported so they never load until the
 * user actually exports (~120 KB gzip stays out of the app bundle).
 */
export async function exportPdf(report: PdfReport): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Brand header bar
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 54, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PC Power Calculator', 40, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(pdfText(`Energy & cost report - ${date}`), 40, 42);

  // Build title
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(pdfText(report.buildName), 40, 84);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    pdfText(
      [
        report.buildCategory ? report.buildCategory : null,
        report.locationLabel,
        `Generated ${date}`,
      ]
        .filter(Boolean)
        .join('  |  '),
    ),
    40,
    98,
  );

  let y = 116;

  // Location & tariff summary
  doc.setDrawColor(0xe5, 0xe7, 0xeb);
  doc.setLineWidth(1);
  doc.line(40, y - 10, pageW - 40, y - 10);
  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text('TARIFF', 40, y);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(pdfText(report.tariffLabel), 40, y + 14);
  y += 34;

  // Devices table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...INK);
  doc.text('Devices', 40, y);
  y += 6;

  const deviceBody = report.devices.map((d) => [
    pdfText(d.name),
    CATEGORY_LABEL[d.category] ?? d.category,
    String(d.qty),
    d.unitW != null ? String(Math.round(d.unitW)) : '-',
    d.unitW != null ? String(Math.round(d.totalW)) : '-',
  ]);
  const deviceTotalW = report.devices.reduce((a, d) => a + (d.unitW != null ? d.totalW : 0), 0);
  autoTable(doc, {
    startY: y,
    head: [['Device', 'Category', 'Qty', 'W/unit', 'Total W']],
    body: deviceBody,
    foot: [['Total rated draw', '', '', '', String(Math.round(deviceTotalW))]],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: INK, lineColor: [0xe5, 0xe7, 0xeb], lineWidth: 0.5 },
    headStyles: { fillColor: [0x24, 0x27, 0x2d], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [0xf3, 0xf4, 0xf6], textColor: INK, fontStyle: 'bold' },
    columnStyles: {
      1: { cellWidth: 90 },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 56, halign: 'right' },
      4: { cellWidth: 56, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
  });

  type DocWithLastTable = { lastAutoTable?: { finalY: number } };
  y = ((doc as unknown as DocWithLastTable).lastAutoTable?.finalY ?? y) + 24;

  // PSU sizing
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Power supply sizing', 40, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const installed = report.installedPsuW;
  const psuLines = [
    `Peak draw (all components at 100%): ${Math.round(report.peakWallDrawW)} W`,
    `Recommended PSU (35% headroom): ${report.recommendedPsuW} W`,
    installed != null
      ? installed >= report.recommendedPsuW
        ? `Installed PSU: ${installed} W - sufficient headroom`
        : `Installed PSU: ${installed} W - UNDERSIZED, upgrade recommended`
      : 'No PSU selected',
  ];
  for (const line of psuLines) {
    doc.setTextColor(...(line.includes('UNDERSIZED') ? RED : INK));
    doc.text(pdfText(line), 40, y);
    y += 14;
  }
  y += 10;

  // Usage schedule + per-workload cost
  if (report.schedule.length > 0) {
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Usage & cost', 40, y);
    y += 6;
    const totalKwh = report.schedule.reduce((a, s) => a + s.kwhYear, 0);
    const totalCost = report.schedule.reduce((a, s) => a + s.costYear, 0);
    autoTable(doc, {
      startY: y,
      head: [['Workload', 'Hours/day', 'Days/week', 'Draw W', 'Energy/yr', 'Cost/yr']],
      body: report.schedule.map((s) => [
        pdfText(s.name),
        String(s.hoursPerDay),
        String(s.daysPerWeek),
        String(Math.round(s.drawW)),
        pdfKwh(s.kwhYear, 0),
        pdfMoney(s.costYear, report.currency),
      ]),
      foot: [['Total', '', '', '', pdfKwh(totalKwh, 0), pdfMoney(totalCost, report.currency)]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: INK, lineColor: [0xe5, 0xe7, 0xeb], lineWidth: 0.5 },
      headStyles: { fillColor: [0x24, 0x27, 0x2d], textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [0xf3, 0xf4, 0xf6], textColor: INK, fontStyle: 'bold' },
      columnStyles: {
        1: { cellWidth: 56, halign: 'right' },
        2: { cellWidth: 56, halign: 'right' },
        3: { cellWidth: 52, halign: 'right' },
        4: { cellWidth: 70, halign: 'right' },
        5: { cellWidth: 80, halign: 'right' },
      },
      margin: { left: 40, right: 40 },
    });
    y = ((doc as unknown as DocWithLastTable).lastAutoTable?.finalY ?? y) + 24;
  }

  // Period totals
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Totals', 40, y);
  y += 6;
  autoTable(doc, {
    startY: y,
    head: [['Period', 'Energy', 'Cost']],
    body: [
      ['Daily', pdfKwh(report.totals.daily.kwh), pdfMoney(report.totals.daily.cost, report.currency)],
      ['Monthly', pdfKwh(report.totals.monthly.kwh, 1), pdfMoney(report.totals.monthly.cost, report.currency)],
      ['Yearly', pdfKwh(report.totals.yearly.kwh, 0), pdfMoney(report.totals.yearly.cost, report.currency)],
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: INK, lineColor: [0xe5, 0xe7, 0xeb], lineWidth: 0.5 },
    headStyles: { fillColor: [0xe5, 0x46, 0x1f], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      1: { cellWidth: 110, halign: 'right' },
      2: { cellWidth: 110, halign: 'right' },
    },
    margin: { left: 40, right: 40 },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(0xe5, 0xe7, 0xeb);
    doc.setLineWidth(0.5);
    doc.line(40, pageH - 40, pageW - 40, pageH - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      pdfText('Estimates use manufacturer TDP ratings with workload utilization profiles; PSU efficiency and a 35% sizing margin are modeled.'),
      40,
      pageH - 28,
    );
    doc.text('pcpower.concreteinfo.co.in', 40, pageH - 17);
    doc.text(`Page ${p} of ${pageCount}`, pageW - 40, pageH - 17, { align: 'right' });
  }

  doc.save(`pc-power-${slugify(report.buildName)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
