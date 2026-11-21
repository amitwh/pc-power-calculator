// @vitest-environment node
/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/export/pdfDocument';
import { registerReportFonts } from '@/lib/export/reportFonts';
import { emptyReport, gamingReport, lakhReport } from './fixtures';

function hasPdftotext(): boolean {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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

  test.skipIf(!hasPdftotext())(
    'prints the rupee glyph and Indian grouping in the text layer',
    async () => {
      const buffer = await renderToBuffer(<ReportDocument report={lakhReport} />);

      expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
      expect(buffer.length).toBeLessThan(2 * 1024 * 1024);

      const tmpDir = path.join(process.cwd(), 'tests/tmp');
      mkdirSync(tmpDir, { recursive: true });
      const pdfPath = path.join(tmpDir, 'report.pdf');
      writeFileSync(pdfPath, buffer);

      const text = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
      expect(text).toContain('₹1,23,456.50');
      expect(text).not.toContain('Rs.');
    },
  );
});
