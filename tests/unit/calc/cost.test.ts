/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { computeCost, effectiveRate } from '@/lib/calc/cost';
import type { TariffRate, TaxRule } from '@/types/tariff';

const indiaDomestic: TariffRate = {
  currency: 'INR',
  slabs: [
    { upTo_kwh: 50, rate: 3.50 },
    { upTo_kwh: 150, rate: 5.00 },
    { upTo_kwh: 300, rate: 6.50 },
    { upTo_kwh: null, rate: 7.50 },
  ],
};

const flat: TariffRate = { currency: 'INR', flat: 7.50 };

describe('computeCost', () => {
  test('flat rate is energy × rate', () => {
    const r = computeCost(100, flat, []);
    expect(r.subtotal).toBe(750);
    expect(r.total).toBe(750);
  });
  test('tiered walks slabs in order', () => {
    // 100 kWh: 50 × 3.50 + 50 × 5.00 = 175 + 250 = 425
    const r = computeCost(100, indiaDomestic, []);
    expect(r.subtotal).toBe(425);
  });
  test('tiered with energy crossing three slabs', () => {
    // 200 kWh: 50×3.50 + 100×5.00 + 50×6.50 = 175 + 500 + 325 = 1000
    const r = computeCost(200, indiaDomestic, []);
    expect(r.subtotal).toBe(1000);
  });
  test('taxes applied on subtotal', () => {
    const taxes: TaxRule[] = [{ name: 'GST', rate_pct: 18, appliesTo: 'total' }];
    const r = computeCost(100, flat, taxes);
    expect(r.total).toBeCloseTo(750 * 1.18, 2);
  });
  test('appliesTo: "energy" taxes are computed on subtotal, not running total', () => {
    const taxes: TaxRule[] = [
      { name: 'Renewable surcharge', rate_pct: 5, appliesTo: 'energy' },
      { name: 'GST', rate_pct: 18, appliesTo: 'total' },
    ];
    const r = computeCost(100, flat, taxes);
    // subtotal = 750
    // renewable = 750 * 0.05 = 37.50 (based on subtotal)
    // running = 750 + 37.50 = 787.50
    // GST = 787.50 * 0.18 = 141.75 (based on running total)
    // total = 750 + 37.50 + 141.75 = 929.25
    expect(r.subtotal).toBe(750);
    expect(r.taxBreakdown['Renewable surcharge']).toBeCloseTo(37.5, 2);
    expect(r.taxBreakdown['GST']).toBeCloseTo(141.75, 2);
    expect(r.total).toBeCloseTo(929.25, 2);
  });
  test('appliesTo: "energy" does NOT compound on itself when stacked', () => {
    const taxes: TaxRule[] = [
      { name: 'Surcharge A', rate_pct: 5, appliesTo: 'energy' },
      { name: 'Surcharge B', rate_pct: 5, appliesTo: 'energy' },
    ];
    const r = computeCost(100, flat, taxes);
    // Each surcharge is 750 * 0.05 = 37.50 (NOT 750 * 1.05 * 0.05).
    expect(r.taxBreakdown['Surcharge A']).toBeCloseTo(37.5, 2);
    expect(r.taxBreakdown['Surcharge B']).toBeCloseTo(37.5, 2);
    expect(r.total).toBeCloseTo(825, 2);
  });
});

describe('effectiveRate', () => {
  test('flat rate returned as-is', () => {
    expect(effectiveRate(100, flat)).toBe(7.5);
  });
  test('tiered effective rate is subtotal / energy', () => {
    expect(effectiveRate(100, indiaDomestic)).toBe(4.25);
  });
});

test('property: tiered cost is monotonically non-decreasing with energy', () => {
  fc.assert(
    fc.property(fc.float({ min: 0, max: 5000, noNaN: true }), (energy) => {
      const r1 = computeCost(energy, indiaDomestic, []).subtotal;
      const r2 = computeCost(energy + 1, indiaDomestic, []).subtotal;
      return r2 >= r1;
    }),
  );
});
