/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { convertCurrency, fxRateFor, getBundledFxSnapshot } from '@/lib/data/fx';

const snapshot = getBundledFxSnapshot();

describe('bundled FX snapshot', () => {
  test('base currency resolves to rate 1', () => {
    expect(fxRateFor(snapshot, snapshot.base)).toBe(1);
  });

  test('unknown currency resolves to null', () => {
    expect(fxRateFor(snapshot, 'XYZ')).toBeNull();
  });
});

describe('convertCurrency', () => {
  test('same-code conversion is the identity', () => {
    expect(convertCurrency(1234.5, 'INR', 'INR', snapshot)).toBe(1234.5);
    expect(convertCurrency(42, snapshot.base, snapshot.base, snapshot)).toBe(42);
  });

  test('base → foreign multiplies by the rate', () => {
    const usd = convertCurrency(100, 'USD', 'INR', snapshot)!;
    expect(usd).toBeCloseTo(100 * snapshot.rates.INR, 6);
  });

  test('foreign → base divides by the rate', () => {
    const usd = convertCurrency(8350, 'INR', 'USD', snapshot)!;
    expect(usd).toBeCloseTo(8350 / snapshot.rates.INR, 6);
  });

  test('cross rates route through the base (USD → EUR equals manual walk)', () => {
    if (snapshot.rates.EUR == null) return; // snapshot lacks EUR — skip
    const direct = convertCurrency(10, 'USD', 'EUR', snapshot)!;
    expect(direct).toBeCloseTo(10 * snapshot.rates.EUR, 6);
  });

  test('unknown codes return null (callers fall back to raw amounts)', () => {
    expect(convertCurrency(100, 'USD', 'XYZ', snapshot)).toBeNull();
    expect(convertCurrency(100, 'XYZ', 'USD', snapshot)).toBeNull();
  });
});
