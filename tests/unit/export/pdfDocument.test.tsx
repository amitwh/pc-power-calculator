// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/export/pdfDocument';
import { emptyReport, gamingReport } from './fixtures';

describe('ReportDocument', () => {
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
});
