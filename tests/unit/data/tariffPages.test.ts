/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { listTariffPages } from '@/lib/data/tariffPages';
import { findTariff } from '@/lib/data/tariffs';

describe('listTariffPages', () => {
  test('lists one country page plus one page per subdivision', () => {
    // 18 countries overall (2 with subdivisions: India's 34 and the US's 20).
    expect(listTariffPages()).toHaveLength(18 + 34 + 20);
  });

  test('includes Indian and US subdivision pages', () => {
    const paths = listTariffPages().map((ref) => ref.path);
    expect(paths).toContain('/cost/in/mh');
    expect(paths).toContain('/cost/us/ca');
  });

  test('every path is a country code plus an optional lowercase slug', () => {
    for (const ref of listTariffPages()) {
      expect(ref.path).toMatch(/^\/cost\/[a-z]{2}(\/[a-z-]+)?$/);
    }
  });

  test('every (iso2, code) pair resolves through findTariff', () => {
    for (const ref of listTariffPages()) {
      const schedule = findTariff(ref.iso2, ref.subdivisionCode);
      expect(schedule, ref.path).toBeDefined();
      if (ref.subdivisionCode) {
        // The subdivision rate must win over the country default.
        expect(schedule?.subdivisions, ref.path).toBeUndefined();
      }
    }
  });

  test('labels join subdivision and country, or just the country', () => {
    const pages = listTariffPages();
    expect(pages.find((ref) => ref.path === '/cost/in/mh')?.label).toBe('Maharashtra, India');
    expect(pages.find((ref) => ref.path === '/cost/in')?.label).toBe('India');
    expect(pages.find((ref) => ref.path === '/cost/us')?.label).toBe('United States');
  });
});
