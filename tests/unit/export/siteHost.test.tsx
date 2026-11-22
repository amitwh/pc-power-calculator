// @vitest-environment node
/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/export/pdf';
import { buildExportHtml } from '@/lib/export/html';
import { registerReportFonts } from '@/lib/export/reportFonts';
import { SITE, SITE_HOST } from '@/lib/site';
import { pageMetaFor } from '@/lib/seo/routeMeta';
import { bigReport } from './fixtures';

/**
 * One host, everywhere.
 *
 * The report footer and the canonical tags have to name the same origin. When
 * they did not — the footer still naming the old domain after the site had
 * moved — the report handed the reader an address that was not the site it
 * came from, and nothing failed loudly enough to catch it.
 */
describe('the site host', () => {
  // The report's faces have to be registered before the renderer can lay out
  // a page, and Node cannot resolve the browser's `/fonts/report` URL — so
  // the absolute path to the same files is used instead.
  beforeAll(() => {
    registerReportFonts(path.join(process.cwd(), 'public/fonts/report'));
  });

  test('the canonical origin is the one the app is served from', () => {
    expect(SITE).toBe('https://pcpower.concreteinfo.net');
    expect(SITE_HOST).toBe('pcpower.concreteinfo.net');
  });

  test('the page metadata and the report footer name the same host', () => {
    expect(pageMetaFor('/')).toBeTruthy();

    const html = buildExportHtml(bigReport(1), {
      id: 'b1',
      name: 'Host check',
      category: 'general',
      components: {},
      tdpOverrides: {},
      schedule: [],
      location: { country_iso2: 'IN' },
    });

    // The footer's link and its visible text.
    expect(html).toContain(`<a href="${SITE}">${SITE_HOST}</a>`);
    expect(html).toContain(`${SITE_HOST} · Report ID`);
    // The re-import link opens the build in the app, on the same host.
    expect(html).toContain(`${SITE}/compare?builds=`);
    // And nothing names any other host.
    expect(html).not.toContain('concreteinfo.co.in');
  });

  test('the PDF footer names the same host', async () => {
    const buffer = await renderToBuffer(
      <ReportDocument report={bigReport(1)} generatedAt={new Date()} />,
    );
    const text = extractText(buffer);
    expect(text).toContain(SITE_HOST);
    expect(text).not.toContain('concreteinfo.co.in');
  }, 30_000);
});

/** The text layer of a PDF, so the footer can be asserted on. */
function extractText(buffer: Buffer): string {
  const file = path.join(process.cwd(), 'tests/tmp/host-check.pdf');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, buffer);
  return execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' });
}
