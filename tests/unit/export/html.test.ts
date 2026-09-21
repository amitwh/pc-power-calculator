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
});