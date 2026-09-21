/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import {
  findTariff,
  listCountries,
  effectiveRateForCountry,
} from '@/lib/data/tariffs';

describe('tariffs loader', () => {
  test('listCountries returns at least India, US, UK', () => {
    const c = listCountries();
    const codes = c.map((x) => x.iso2);
    expect(codes).toContain('IN');
    expect(codes).toContain('US');
    expect(codes).toContain('GB');
  });

  test('findTariff(IN, IN-KL) has subdivisions for Kerala', () => {
    const t = findTariff('IN', 'IN-KL');
    expect(t?.default.currency ?? t?.subdivisions?.[0]?.rate.currency).toBe('INR');
  });

  test('effectiveRateForCountry returns a number for known country', () => {
    const rate = effectiveRateForCountry('IN', 'IN-KL');
    expect(rate.flat ?? rate.slabs?.[0]?.rate).toBeGreaterThan(0);
  });

  test('effectiveRateForCountry returns flat 0.10 for unknown country (fallback)', () => {
    const rate = effectiveRateForCountry('ZZ');
    expect(rate.flat).toBe(0.10);
  });
});
