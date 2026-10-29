/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { CATEGORY_COLORS, categoryColor } from '@/lib/categoryColors';
import type { ComponentCategory } from '@/types/component';

const ALL_CATEGORIES: ComponentCategory[] = [
  'cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu', 'cooler', 'monitor',
  'add_in_card', 'optical_drive', 'ups', 'peripheral', 'fan',
];

describe('category colors', () => {
  test('every component category has a color identity', () => {
    for (const cat of ALL_CATEGORIES) {
      const c = CATEGORY_COLORS[cat];
      expect(c, `missing color for ${cat}`).toBeDefined();
      expect(c.hex).toMatch(/^#[0-9a-f]{6}$/i);
      expect(c.pdf).toHaveLength(3);
      for (const v of c.pdf) expect(v).toBeGreaterThanOrEqual(0);
      expect(c.badge).toContain('text-');
      expect(c.bar).toMatch(/^border-l-/);
    }
  });

  test('colors are distinct across categories (distinguishable shades)', () => {
    const hexes = ALL_CATEGORIES.map((c) => CATEGORY_COLORS[c].hex);
    expect(new Set(hexes).size).toBe(ALL_CATEGORIES.length);
  });

  test('unknown categories fall back to a neutral gray', () => {
    const fallback = categoryColor('nope');
    expect(fallback.hex).toBe('#9ca3af');
    expect(categoryColor('cpu').hex).toBe(CATEGORY_COLORS.cpu.hex);
  });
});
