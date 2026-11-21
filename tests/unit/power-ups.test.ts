/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { systemPowerW } from '@/lib/calc/power';
import type { Component } from '@/types/component';

const cpu: Component = {
  id: 'c1', category: 'cpu', brand: 'Test', model: 'CPU', releaseYear: 2025,
  tdp_w: 100, specs: {}, source: 'test', addedAt: '2026-01-01',
};
const psu: Component = {
  id: 'p1', category: 'psu', brand: 'Test', model: 'PSU', releaseYear: 2025,
  tdp_w: 0, specs: { wattage_w: 750, rating: 'gold' }, source: 'test', addedAt: '2026-01-01',
};
const ups = (efficiency_pct?: number): Component => ({
  id: 'u1', category: 'ups', brand: 'Test', model: 'UPS', releaseYear: 2025,
  tdp_w: 0, specs: efficiency_pct == null ? {} : { efficiency_pct }, source: 'test', addedAt: '2026-01-01',
});

const full = { cpu: 1, gpu: 0, ram: 0, storage: 0 };

describe('UPS conversion losses', () => {
  test('without a UPS the wall draw is only the PSU conversion', () => {
    const r = systemPowerW([cpu, psu], full, 'gold', 750);
    expect(r.upsEfficiency).toBe(1);
    expect(r.wallDrawW).toBeGreaterThan(100);
  });

  test('a UPS adds a second conversion stage on top of the PSU', () => {
    const without = systemPowerW([cpu, psu], full, 'gold', 750).wallDrawW;
    const with95 = systemPowerW([cpu, psu, ups(95)], full, 'gold', 750);
    expect(with95.upsEfficiency).toBeCloseTo(0.95, 5);
    expect(with95.wallDrawW).toBeGreaterThan(without);
    // 95% efficiency means the wall figure is the no-UPS figure / 0.95.
    expect(with95.wallDrawW).toBeCloseTo(without / 0.95, 1);
  });

  test('a stated efficiency is used; a missing one falls back to 95%', () => {
    expect(systemPowerW([cpu, psu, ups(88)], full, 'gold', 750).upsEfficiency).toBeCloseTo(0.88, 5);
    expect(systemPowerW([cpu, psu, ups()], full, 'gold', 750).upsEfficiency).toBe(0.95);
  });

  test('an implausible stated efficiency is ignored', () => {
    expect(systemPowerW([cpu, psu, ups(150)], full, 'gold', 750).upsEfficiency).toBe(0.95);
    expect(systemPowerW([cpu, psu, ups(2)], full, 'gold', 750).upsEfficiency).toBe(0.95);
  });
});
