/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import type { Component } from '@/types/component';
import { isIndexablePart, indexableParts, PART_PAGE_MIN_YEAR } from '@/lib/data/partPages';

function makeComponent(overrides: Partial<Component> = {}): Component {
  return {
    id: 'cpu-test',
    category: 'cpu',
    brand: 'Test',
    model: 'Part',
    releaseYear: PART_PAGE_MIN_YEAR,
    tdp_w: 65,
    specs: {},
    source: 'test',
    addedAt: '2026-01-01',
    ...overrides,
  };
}

describe('isIndexablePart — tranche 1 filter', () => {
  test('includes a CPU released in the minimum year with a rated TDP', () => {
    expect(isIndexablePart(makeComponent())).toBe(true);
  });

  test('includes a GPU released after the minimum year with a rated TDP', () => {
    expect(isIndexablePart(makeComponent({ category: 'gpu', releaseYear: PART_PAGE_MIN_YEAR + 1 }))).toBe(true);
  });

  test('excludes parts released before the minimum year', () => {
    expect(isIndexablePart(makeComponent({ releaseYear: PART_PAGE_MIN_YEAR - 1 }))).toBe(false);
  });

  test('excludes non-CPU/GPU categories', () => {
    expect(isIndexablePart(makeComponent({ category: 'ram' }))).toBe(false);
    expect(isIndexablePart(makeComponent({ category: 'psu' }))).toBe(false);
  });

  test('excludes parts with no rated TDP', () => {
    expect(isIndexablePart(makeComponent({ tdp_w: null }))).toBe(false);
  });
});

describe('indexableParts — over the seeded catalog', () => {
  test('returns only parts that satisfy the tranche filter', () => {
    const parts = indexableParts();
    expect(parts.length).toBeGreaterThan(0);
    for (const part of parts) {
      expect(part.category === 'cpu' || part.category === 'gpu').toBe(true);
      expect(part.tdp_w).not.toBeNull();
      expect(part.releaseYear).toBeGreaterThanOrEqual(PART_PAGE_MIN_YEAR);
    }
  });
});
