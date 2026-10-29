/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { coercePsuRating, psuEfficiency, psuWattageFromSpecs, recommendPsuW, wallDrawW } from '@/lib/calc/psu';

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
  test('pre-80 PLUS generic units use the low-efficiency curve', () => {
    expect(psuEfficiency('none', 50)).toBe(0.74);
  });
});

describe('coercePsuRating', () => {
  test('normalizes catalog casing ("Gold" → gold)', () => {
    expect(coercePsuRating('Gold')).toBe('gold');
    expect(coercePsuRating('Platinum')).toBe('platinum');
    expect(coercePsuRating('Bronze')).toBe('bronze');
    expect(coercePsuRating('Titanium')).toBe('titanium');
  });
  test('accepts alternate spellings of 80 PLUS', () => {
    expect(coercePsuRating('80 plus')).toBe('80-plus');
    expect(coercePsuRating('80-plus')).toBe('80-plus');
  });
  test('maps generic units to the none curve', () => {
    expect(coercePsuRating('none')).toBe('none');
  });
  test('returns null for unknown or non-string values', () => {
    expect(coercePsuRating('80 Plus Bronze')).toBeNull();
    expect(coercePsuRating('')).toBeNull();
    expect(coercePsuRating(undefined)).toBeNull();
    expect(coercePsuRating(42)).toBeNull();
  });
});

describe('psuWattageFromSpecs', () => {
  test('reads wattage_w (catalog convention)', () => {
    expect(psuWattageFromSpecs({ wattage_w: 750 })).toBe(750);
  });
  test('falls back to wattage/watts aliases', () => {
    expect(psuWattageFromSpecs({ wattage: 650 })).toBe(650);
    expect(psuWattageFromSpecs({ watts: 500 })).toBe(500);
  });
  test('returns null for missing or invalid wattage', () => {
    expect(psuWattageFromSpecs({})).toBeNull();
    expect(psuWattageFromSpecs({ wattage_w: -5 })).toBeNull();
    expect(psuWattageFromSpecs({ wattage_w: 'lots' })).toBeNull();
  });
});

describe('recommendPsuW', () => {
  test('adds 35% headroom and snaps to a standard rating', () => {
    // 300 W peak × 1.35 = 405 → snaps to 450 W
    expect(recommendPsuW(300)).toBe(450);
    // 500 W × 1.35 = 675 → 700 W
    expect(recommendPsuW(500)).toBe(700);
  });
  test('never recommends below the peak draw', () => {
    expect(recommendPsuW(50)).toBeGreaterThanOrEqual(50);
  });
  test('handles 0 and very large draws', () => {
    expect(recommendPsuW(0)).toBe(300);
    expect(recommendPsuW(5000)).toBeGreaterThan(5000);
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
