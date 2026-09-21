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
