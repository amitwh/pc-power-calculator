/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { formatCost, formatKwh } from '@/lib/calc/format';
import type { CurrencyInfo } from '@/types/currency';

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

describe('formatKwh', () => {
  test('formats with 1 decimal by default', () => {
    expect(formatKwh(442.34)).toBe('442.3 kWh');
  });
  test('formats with 0 decimals when requested', () => {
    expect(formatKwh(442.34, 0)).toBe('442 kWh');
  });
});
