/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { psuEfficiency, wallDrawW } from '@/lib/calc/psu';

describe('psuEfficiency', () => {
  test('Gold at 50% load is 0.90', () => {
    expect(psuEfficiency('gold', 50)).toBe(0.90);
  });
  test('Bronze at 20% load is 0.85', () => {
    expect(psuEfficiency('bronze', 20)).toBe(0.85);
  });
  test('interpolates between reference points', () => {
    // Gold curve: 10%→0.86, 20%→0.89, 50%→0.90, 100%→0.88.
    // Linear interpolation between 20% and 50% at 35% load: t=0.5, eff = 0.89 + 0.5*(0.90-0.89) = 0.895.
    expect(psuEfficiency('gold', 35)).toBeCloseTo(0.895, 3);
  });
  test('clamps load to [10, 100]', () => {
    expect(psuEfficiency('gold', 0)).toBe(0.86);
    expect(psuEfficiency('gold', 150)).toBe(0.88);
  });
});

describe('wallDrawW', () => {
  test('divides by efficiency', () => {
    // Gold at 75% load: linear between 50% (0.90) and 100% (0.88), t=0.5 → eff = 0.89.
    expect(wallDrawW(450, 'gold', 75)).toBeCloseTo(450 / 0.89, 2);
  });
  test('falls back to 85% when rating is null', () => {
    expect(wallDrawW(425, null, 50)).toBeCloseTo(500, 2);
  });
});
