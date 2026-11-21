/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { coalKgPerKwh, equivalences } from '@/lib/calc/equivalences';
import { averageWallW, tierFor, tierPosition } from '@/lib/calc/classify';

describe('equivalences', () => {
  test('nothing is returned for zero energy', () => {
    expect(equivalences(0)).toEqual([]);
    expect(equivalences(Number.NaN)).toEqual([]);
  });

  test('coal arithmetic follows plant physics', () => {
    // 3.6 MJ/kWh ÷ (24 MJ/kg × 0.35) ≈ 0.43 kg coal per kWh
    expect(coalKgPerKwh()).toBeCloseTo(0.4286, 3);
  });

  test('every equivalence states its basis', () => {
    for (const e of equivalences(421, 299)) {
      expect(e.basis.length).toBeGreaterThan(20);
      expect(e.value).toBeTruthy();
    }
  });

  test('an EV figure scales with energy', () => {
    const one = equivalences(150).find((e) => e.label.includes('electric car'))!;
    const two = equivalences(300).find((e) => e.label.includes('electric car'))!;
    // 150 kWh ÷ 0.15 kWh/km = 1,000 km; double the energy doubles the distance.
    expect(one.value).toBe('1,000');
    expect(two.value).toBe('2,000');
  });

  test('the CO2 equivalence only appears when a CO2 figure is supplied', () => {
    expect(equivalences(421).some((e) => e.label.includes('trees'))).toBe(false);
    expect(equivalences(421, 299).some((e) => e.label.includes('trees'))).toBe(true);
  });
});

describe('consumption tiers', () => {
  test('average wall draw derives from annual energy', () => {
    // 876 kWh over a year is 100 W continuous.
    expect(averageWallW(876)).toBeCloseTo(100, 0);
  });

  test('tiers cover the range without gaps', () => {
    expect(tierFor(5).key).toBe('standby');
    expect(tierFor(100).key).toBe('everyday');
    expect(tierFor(400).key).toBe('workstation');
    expect(tierFor(2000).key).toBe('heavy');
  });

  test('the gauge position is bounded to 0-100', () => {
    expect(tierPosition(0)).toBe(0);
    expect(tierPosition(100000)).toBe(100);
  });
});
