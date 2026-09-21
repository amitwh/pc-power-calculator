/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { buildExportHtml } from '@/lib/export/html';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

const build: BuildConfig = {
  id: 'x',
  name: 'Test',
  components: { cpu: 'cpu-amd-ryzen-7-7800x3d' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};
const inr: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 };

const results = {
  daily:   { total: { kwh: 1.2, cost: 9 } },
  monthly: { total: { kwh: 36,  cost: 273 } },
  yearly:  { total: { kwh: 442, cost: 3318 } },
};

describe('buildExportHtml', () => {
  test('contains build name and yearly figures', () => {
    const html = buildExportHtml(build, results, inr);
    expect(html).toContain('Test');
    expect(html).toContain('442');
    expect(html).toContain('3,318');
  });
  test('embeds build config JSON in script tag', () => {
    const html = buildExportHtml(build, results, inr);
    expect(html).toMatch(/<script type="application\/json"[^>]*>[\s\S]+<\/script>/);
  });
  test('is a complete HTML document with DOCTYPE', () => {
    const html = buildExportHtml(build, results, inr);
    expect(html).toMatch(/^<!doctype html>/i);
  });

  test('escapes <script> in build name — no executable tag in <title> or <h1>', () => {
    const malicious: BuildConfig = { ...build, name: '<script>alert(1)</script>' };
    const html = buildExportHtml(malicious, results, inr);
    // The literal payload must not appear unescaped inside title or h1.
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/);
    const h1Match = html.match(/<h1>([\s\S]*?)<\/h1>/);
    expect(titleMatch).not.toBeNull();
    expect(h1Match).not.toBeNull();
    expect(titleMatch![1]).not.toContain('<script>');
    expect(titleMatch![1]).not.toContain('</script>');
    expect(h1Match![1]).not.toContain('<script>');
    expect(h1Match![1]).not.toContain('</script>');
    // The escaped form should be present in the rendered HTML.
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('escapes &, quotes, and unicode line separators in build name', () => {
    // Build a name that contains raw U+2028 and U+2029 codepoints via
    // JavaScript escape sequences so this test source remains parseable.
    const LS = ' ';
    const PS = ' ';
    const tricky: BuildConfig = {
      ...build,
      name: `A & "B" 'C' ${LS}D ${PS}E`,
    };
    const html = buildExportHtml(tricky, results, inr);
    // &, double-quote, and single-quote are HTML-encoded in the rendered text.
    expect(html).toContain('A &amp;');
    expect(html).toContain('&quot;B&quot;');
    expect(html).toContain('&#39;C&#39;');
    // The raw U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR) chars
    // in the build name must be neutralised in the embedded JSON script body
    // so a JS parser cannot mistake them for string-terminating line breaks.
    expect(html).toContain('\\u2028');
    expect(html).toContain('\\u2029');
    const scriptMatch = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
    expect(scriptMatch).not.toBeNull();
    expect(scriptMatch![1]).not.toContain(LS);
    expect(scriptMatch![1]).not.toContain(PS);
  });
});
