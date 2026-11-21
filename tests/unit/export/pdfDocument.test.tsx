// @vitest-environment node
/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument, type ExportPdfOptions } from '@/lib/export/pdf';
import type { PdfReport } from '@/lib/export/report';
import { registerReportFonts } from '@/lib/export/reportFonts';
import {
  bigReport,
  emptyReport,
  gamingReport,
  lakhReport,
  reportWithoutPsuAndMeasured,
} from './fixtures';

function hasBinary(name: string): boolean {
  try {
    execFileSync(name, ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const PDF_PATH = path.join(process.cwd(), 'tests/tmp/report.pdf');

/** A 1×1 transparent PNG, small enough to embed in every render. */
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==';

function writePdf(buffer: Buffer): string {
  mkdirSync(path.dirname(PDF_PATH), { recursive: true });
  writeFileSync(PDF_PATH, buffer);
  return PDF_PATH;
}

/** Render, keep the PDF on disk for inspection, and return its text layer. */
async function renderAndExtract(report: PdfReport, opts: ExportPdfOptions = {}): Promise<string> {
  const buffer = await renderToBuffer(
    <ReportDocument report={report} generatedAt={new Date('2026-11-21T09:15:00+05:30')} {...opts} />,
  );
  const pdfPath = writePdf(buffer);
  return execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
}

function pdfPageCount(pdfPath: string): number {
  const info = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  const match = /^Pages:\s+(\d+)/m.exec(info);
  return match ? Number(match[1]) : NaN;
}

describe('ReportDocument', () => {
  // The document itself never registers fonts; the export wrapper and the
  // test harness do. An absolute path is used here because Node cannot resolve
  // the browser's `/fonts/report` URL.
  beforeAll(() => {
    registerReportFonts(path.join(process.cwd(), 'public/fonts/report'));
  });

  test('renders a report with no components without crashing', async () => {
    const buffer = await renderToBuffer(<ReportDocument report={emptyReport} />);

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(5000);
  });

  test('renders a populated gaming report as a real PDF', async () => {
    const buffer = await renderToBuffer(<ReportDocument report={gamingReport} />);

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(10000);
  });

  test.skipIf(!hasBinary('pdftotext'))(
    'prints the rupee glyph and Indian grouping in the text layer',
    async () => {
      const buffer = await renderToBuffer(<ReportDocument report={lakhReport} />);

      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeLessThan(2 * 1024 * 1024);

      const text = execFileSync('pdftotext', ['-layout', writePdf(buffer), '-'], {
        encoding: 'utf8',
      });
      expect(text).toContain('₹1,23,456.50');
      expect(text).not.toContain('Rs.');
    },
  );

  test.skipIf(!hasBinary('pdftotext'))(
    'a 30-component table repeats its header on each chunk',
    async () => {
      const text = await renderAndExtract(bigReport(30));

      expect(text.match(/Device\s+Category\s+Qty/g)?.length ?? 0).toBeGreaterThan(1);
    },
  );

  test.skipIf(!hasBinary('pdftotext'))(
    'missing PSU and readings render dashes, not undefined',
    async () => {
      const text = await renderAndExtract(reportWithoutPsuAndMeasured);

      expect(text).toContain('Not selected');
      expect(text).not.toContain('undefined');
      expect(text).toContain('No meter readings were entered');
    },
  );

  test.skipIf(!hasBinary('pdftotext'))(
    'carbon and equivalence text keeps the subscript and rupee glyph',
    async () => {
      const text = await renderAndExtract(gamingReport);

      expect(text).toContain('CO₂e');
    },
  );

  test.skipIf(!hasBinary('pdftotext') || !hasBinary('pdfinfo'))(
    'prints the faint ConcreteInfo watermark once per page',
    async () => {
      const buffer = await renderToBuffer(<ReportDocument report={gamingReport} />);
      const pdfPath = writePdf(buffer);
      const pages = pdfPageCount(pdfPath);
      expect(pages).toBeGreaterThanOrEqual(2);

      for (let page = 1; page <= pages; page++) {
        // Per-page extraction: the watermark overlaps table rows, so strip
        // whitespace instead of relying on a single -layout line.
        const pageText = execFileSync(
          'pdftotext',
          ['-f', String(page), '-l', String(page), pdfPath, '-'],
          { encoding: 'utf8' },
        );
        expect(pageText.replace(/\s+/g, '')).toContain(
          'ConcreteInfoPCPowerConsumptionCalculator',
        );
      }
    },
  );

  test.skipIf(!hasBinary('pdfinfo'))('the gaming report is 2–3 dense pages', async () => {
    const buffer = await renderToBuffer(<ReportDocument report={gamingReport} />);
    const pages = pdfPageCount(writePdf(buffer));

    expect(pages).toBeGreaterThanOrEqual(2);
    expect(pages).toBeLessThanOrEqual(3);
  });

  test.skipIf(!hasBinary('pdftotext'))(
    'prints the QR permalink caption and URL',
    async () => {
      const text = await renderAndExtract(gamingReport, {
        shareUrl: 'https://pcpower.concreteinfo.co.in/build/abc',
        qrDataUrl: TINY_PNG,
      });

      expect(text).toContain('Scan to open this build');
      expect(text).toContain('https://pcpower.concreteinfo.co.in/build/abc');
    },
  );

  test.skipIf(!hasBinary('pdftotext'))(
    'prints a shortened share URL, never the full build token',
    async () => {
      const longUrl = `https://pcpower.concreteinfo.co.in/build/${'x'.repeat(400)}`;
      const text = await renderAndExtract(gamingReport, {
        shareUrl: longUrl,
        qrDataUrl: TINY_PNG,
      });

      expect(text).toContain('pcpower.concreteinfo.co.in/build/…');
      expect(text).not.toContain('x'.repeat(100));
    },
  );

  test.skipIf(!hasBinary('pdftotext'))(
    'omits the QR block when there is no share URL',
    async () => {
      const text = await renderAndExtract(gamingReport, {
        shareUrl: null,
        qrDataUrl: TINY_PNG,
      });

      expect(text).not.toContain('Scan to open this build');
    },
  );

  test.skipIf(!hasBinary('pdfinfo'))(
    'embeds the logo without growing past three pages',
    async () => {
      const buffer = await renderToBuffer(
        <ReportDocument report={gamingReport} logoDataUrl={TINY_PNG} />,
      );

      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      const pages = pdfPageCount(writePdf(buffer));
      expect(pages).toBeGreaterThanOrEqual(2);
      expect(pages).toBeLessThanOrEqual(3);
    },
  );

  test.skipIf(!hasBinary('pdftotext'))(
    'prints the page-1 header meta and the build identity on continuation pages',
    async () => {
      const text = await renderAndExtract(gamingReport);

      expect(text).toContain('INR report · ');
      expect(text).toMatch(/Gaming build · PCP-/);
    },
  );
});
