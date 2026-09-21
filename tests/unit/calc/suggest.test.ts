/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { suggestAlternatives } from '@/lib/calc/suggest';
import type { BuildConfig } from '@/types/build';
import type { Component } from '@/types/component';

const components: Component[] = [
  { id: 'cpu-amd-ryzen-9-7950x',   category: 'cpu', brand: 'AMD',   model: 'Ryzen 9 7950X',   releaseYear: 2022, tdp_w: 170, specs: {}, source: 'amd.com', addedAt: '2026-09-21' },
  { id: 'cpu-amd-ryzen-7-7800x3d', category: 'cpu', brand: 'AMD',   model: 'Ryzen 7 7800X3D', releaseYear: 2023, tdp_w: 120, specs: {}, source: 'amd.com', addedAt: '2026-09-21' },
  { id: 'cpu-amd-ryzen-5-7600',    category: 'cpu', brand: 'AMD',   model: 'Ryzen 5 7600',    releaseYear: 2023, tdp_w: 65,  specs: {}, source: 'amd.com', addedAt: '2026-09-21' },
];

const build: BuildConfig = {
  id: 'b',
  name: 'B',
  components: { cpu: 'cpu-amd-ryzen-9-7950x' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN' },
};

describe('suggestAlternatives', () => {
  test('returns at most top 3 alternatives for the same category', () => {
    const s = suggestAlternatives(build, components, 'office');
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThanOrEqual(3);
  });
  test('excludes the current component', () => {
    const s = suggestAlternatives(build, components, 'office');
    for (const x of s) expect(x.component_id).toBe('cpu-amd-ryzen-9-7950x');
    for (const x of s) expect(x.alternative.id).not.toBe('cpu-amd-ryzen-9-7950x');
  });
  test('alternative has lower TDP than current', () => {
    const s = suggestAlternatives(build, components, 'office');
    for (const x of s) expect(x.alt.tdp_w!).toBeLessThan(x.current.tdp_w!);
  });
});