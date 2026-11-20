/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { describeTariffRate, formatCost, formatKwh } from '@/lib/calc/format';
import type { CurrencyInfo } from '@/types/currency';
import type { TariffRate } from '@/types/tariff';

const inr: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 };
const usd: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimalDigits: 2 };

describe('formatCost', () => {
  test('INR uses en-IN locale (1,00,000)', () => {
    const s = formatCost(100000, inr);
    expect(s).toMatch(/1,00,000/);
    expect(s).toContain('₹');
  });
  test('USD uses en-US locale (100,000)', () => {
    const s = formatCost(100000, usd);
    expect(s).toMatch(/100,000/);
    expect(s).toContain('$');
  });
  test('respects decimalDigits', () => {
    expect(formatCost(100.567, inr)).toMatch(/100\.57/);
  });
});

describe('describeTariffRate', () => {
  test('flat rate reads as a flat per-kWh price', () => {
    expect(describeTariffRate({ currency: 'INR', flat: 6.5 }, inr)).toContain('flat');
  });

  test('cumulative slabs are described as bands, not ceilings', () => {
    const rate: TariffRate = {
      currency: 'INR',
      slabs: [
        { upTo_kwh: 100, rate: 5.67 },
        { upTo_kwh: 300, rate: 9.9 },
        { upTo_kwh: null, rate: 11 },
      ],
    };
    const text = describeTariffRate(rate, inr);
    expect(text).toContain('up to 100 kWh');
    // The middle slab must be a band — "up to 300" would imply 300 units at 9.90.
    expect(text).toContain('101–300 kWh');
    expect(text).not.toContain('up to 300 kWh');
    expect(text).toContain('above 300 kWh');
  });
});

describe('formatKwh', () => {
  test('formats with 1 decimal by default', () => {
    expect(formatKwh(442.34)).toBe('442.3 kWh');
  });
  test('formats with 0 decimals when requested', () => {
    expect(formatKwh(442.34, 0)).toBe('442 kWh');
  });
});
