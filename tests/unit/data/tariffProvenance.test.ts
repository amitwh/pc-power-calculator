/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { listCountries, tariffProvenance } from '@/lib/data/tariffs';

describe('tariffProvenance', () => {
  test('every country carries a source and an update date', () => {
    for (const c of listCountries()) {
      const p = tariffProvenance(c.iso2);
      expect(p.source, c.iso2).toBeTruthy();
      expect(p.updated, c.iso2).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('a country with no published tariff is flagged as an estimate', () => {
    // Euro-area additions are banded Eurostat figures, not a distributor tariff.
    expect(tariffProvenance('PT').estimated).toBe(true);
    expect(tariffProvenance('BE').estimated).toBe(true);
  });

  test('a country sourced from regulator orders is not flagged', () => {
    expect(tariffProvenance('IN').estimated).toBe(false);
  });

  test('an unknown country defaults to estimated', () => {
    const p = tariffProvenance('ZZ');
    expect(p.estimated).toBe(true);
    expect(p.source).toBeUndefined();
  });
});
