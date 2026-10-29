/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import catalog from '@/data/components.json';
import { listComponents, catalogSize, dataVersion } from '@/lib/data/components';
import type { Component, ComponentCategory } from '@/types/component';

const VALID_CATEGORIES: ComponentCategory[] = [
  'cpu', 'gpu', 'ram', 'storage', 'motherboard', 'psu',
  'cooler', 'monitor', 'add_in_card', 'optical_drive', 'ups', 'peripheral',
];

const all = (catalog as unknown as { components: Component[] }).components;

describe('components.json invariants', () => {
  test('catalog is loaded and non-trivial', () => {
    expect(catalogSize()).toBe(all.length);
    expect(catalogSize()).toBeGreaterThan(1000);
    expect(dataVersion()).not.toBe('');
  });

  test('every entry has the required schema shape', () => {
    for (const c of all) {
      expect(typeof c.id, c.id).toBe('string');
      expect(VALID_CATEGORIES, c.id).toContain(c.category);
      expect(typeof c.brand, c.id).toBe('string');
      expect(typeof c.model, c.id).toBe('string');
      expect(Number.isInteger(c.releaseYear), c.id).toBe(true);
      expect(c.releaseYear, c.id).toBeGreaterThanOrEqual(2000);
      expect(c.releaseYear, c.id).toBeLessThanOrEqual(2026);
      expect(c.tdp_w === null || (typeof c.tdp_w === 'number' && c.tdp_w >= 0), c.id).toBe(true);
      expect(typeof c.specs, c.id).toBe('object');
      expect(c.specs, c.id).not.toBeNull();
      expect(typeof c.source, c.id).toBe('string');
      expect(typeof c.addedAt, c.id).toBe('string');
    }
  });

  test('ids are unique', () => {
    const ids = new Set(all.map((c) => c.id));
    expect(ids.size).toBe(all.length);
  });

  test('(category, brand, model) triples are unique after normalization', () => {
    const seen = new Set<string>();
    for (const c of all) {
      const key = `${c.category}|${c.brand.trim().toLowerCase()}|${c.model.trim().toLowerCase().replace(/\s+/g, ' ')}`;
      expect(seen.has(key), `${c.id} duplicates ${key}`).toBe(false);
      seen.add(key);
    }
  });

  test('covers the 2000–2026 window in every major category', () => {
    for (const cat of ['cpu', 'gpu', 'storage', 'motherboard'] as ComponentCategory[]) {
      const years = listComponents(cat).map((c) => c.releaseYear);
      expect(Math.min(...years), cat).toBeLessThanOrEqual(2006);
      expect(Math.max(...years), cat).toBeGreaterThanOrEqual(2020);
    }
  });

  test('legacy eras are represented (pre-2010 hardware exists)', () => {
    expect(listComponents('cpu').filter((c) => c.releaseYear <= 2004).length).toBeGreaterThan(20);
    expect(listComponents('gpu').filter((c) => c.releaseYear <= 2004).length).toBeGreaterThan(10);
    expect(listComponents('storage').filter((c) => c.specs.type === 'IDE-HDD').length).toBeGreaterThan(5);
    expect(listComponents('ram').filter((c) => c.specs.generation === 'DDR').length).toBeGreaterThan(0);
  });

  test('PSU entries carry a wattage and efficiency the engine understands', () => {
    const psus = listComponents('psu');
    expect(psus.length).toBeGreaterThan(30);
    for (const p of psus) {
      expect(Number(p.specs.wattage_w ?? p.specs.wattage ?? p.specs.watts) > 0, p.id).toBe(true);
      if (p.specs.efficiency != null) {
        const eff = String(p.specs.efficiency).trim().toLowerCase().replace(/\s+/g, '-');
        expect(
          ['none', '80-plus', 'bronze', 'silver', 'gold', 'platinum', 'titanium'],
          `${p.id}: ${p.specs.efficiency}`,
        ).toContain(eff);
      }
    }
  });

  test('coolers keep draw in tdp_w and capacity in specs.tdp_rating_w', () => {
    for (const c of listComponents('cooler')) {
      expect(c.tdp_w ?? 0, c.id).toBeLessThan(30); // fan+pump draw, not capacity
      expect(Number(c.specs.tdp_rating_w ?? 0), c.id).toBeGreaterThan(30);
    }
  });
});
