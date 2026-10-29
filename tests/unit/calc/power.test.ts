/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { componentPowerW, systemPowerW } from '@/lib/calc/power';
import type { Component } from '@/types/component';

const cpu: Component = {
  id: 'cpu-test', category: 'cpu', brand: 'X', model: 'X', releaseYear: 2024,
  tdp_w: 100, specs: {}, source: 'manual', addedAt: '2026-09-21',
};

const gpu: Component = {
  id: 'gpu-test', category: 'gpu', brand: 'X', model: 'X', releaseYear: 2024,
  tdp_w: 200, specs: {}, source: 'manual', addedAt: '2026-09-21',
};

describe('componentPowerW', () => {
  test('CPU at 0 utilization draws idle (15% of TDP)', () => {
    expect(componentPowerW(cpu, 0)).toBeCloseTo(15, 5);
  });
  test('CPU at 100% utilization draws TDP', () => {
    expect(componentPowerW(cpu, 1)).toBeCloseTo(100, 5);
  });
  test('CPU at 50% draws midpoint between idle and TDP', () => {
    expect(componentPowerW(cpu, 0.5)).toBeCloseTo(57.5, 5);
  });
  test('returns 0 for component with null TDP', () => {
    const c = { ...cpu, tdp_w: null };
    expect(componentPowerW(c, 0.5)).toBe(0);
  });
});

describe('systemPowerW', () => {
  test('sums component power scaled by utilization', () => {
    const w = systemPowerW([cpu, gpu], { cpu: 1, gpu: 0.5, ram: 0, storage: 0 }, null);
    // CPU at util 1.0: 15 + (100-15)*1 = 100 W (TDP). GPU at util 0.5: 20 + (200-20)*0.5 = 110 W
    // (GPU idle = 0.10 * TDP per brief JSON; brief's literal formula copy-pasted CPU's 15 W idle).
    // psuRating=null → wallDrawW equals componentDrawW.
    expect(w.componentDrawW).toBeCloseTo(100 + (20 + (200 - 20) * 0.5), 5);
    expect(w.wallDrawW).toBe(w.componentDrawW);
  });
});

describe('era-specific component profiles', () => {
  const part = (category: Component['category'], tdp: number | null, specs: Component['specs']): Component => ({
    id: `test-${category}`, category, brand: 'X', model: 'X', releaseYear: 2005,
    tdp_w: tdp, specs, source: 'manual', addedAt: '2026-10-29',
  });

  test('cooler draws its rated fan/pump power constantly', () => {
    const cooler = part('cooler', 10, { type: 'aio', fan_count: 2, tdp_rating_w: 280 });
    expect(componentPowerW(cooler, 0)).toBe(10);
    expect(componentPowerW(cooler, 1)).toBe(10);
  });

  test('IDE HDD uses the higher-draw profile', () => {
    const ide = part('storage', 10, { type: 'IDE-HDD' });
    expect(componentPowerW(ide, 0)).toBe(6); // ide_hdd idle
    expect(componentPowerW(ide, 1)).toBe(10); // ide_hdd active
  });

  test('DDR1 sticks draw more than modern DDR5', () => {
    const ddr1 = part('ram', 7, { generation: 'DDR' });
    const ddr2 = part('ram', 5, { generation: 'DDR2' });
    const ddr5 = part('ram', 5, { generation: 'DDR5' });
    expect(componentPowerW(ddr1, 0)).toBe(4);
    expect(componentPowerW(ddr2, 0)).toBe(3);
    expect(componentPowerW(ddr5, 0)).toBe(2);
  });

  test('monitor falls back to tdp_w when panel_w is absent', () => {
    const crt = part('monitor', 80, { type: 'CRT' });
    expect(componentPowerW(crt, 0.5)).toBe(80);
  });
});
