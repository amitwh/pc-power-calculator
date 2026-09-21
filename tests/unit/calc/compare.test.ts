/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { compareBuilds } from '@/lib/calc/compare';
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';

const a: BuildConfig = {
  id: 'a',
  name: 'A',
  components: { cpu: 'cpu-amd-ryzen-7-7800x3d' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};
const b: BuildConfig = {
  id: 'b',
  name: 'B',
  components: { cpu: 'cpu-intel-i9-14900k' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};
const ws: Workload[] = [
  {
    id: 'office',
    name: 'Office',
    category: 'productivity',
    description: '',
    utilization: { cpu_pct: 0.5, gpu_pct: 0, ram_pct: 0, storage_pct: 0, monitor_w: 30 },
    benchmarks: [],
  },
];

describe('compareBuilds', () => {
  test('returns one row per workload + a total row', () => {
    const r = compareBuilds([a, b], ws, 'day');
    expect(r.rows.length).toBeGreaterThanOrEqual(1);
    expect(r.totals).toHaveLength(2);
  });
  test('Intel 14900K (125 W) uses more kWh than Ryzen 7 7800X3D (120 W) at 50% util', () => {
    const r = compareBuilds([a, b], ws, 'day');
    expect(r.totals[1].kwh).toBeGreaterThan(r.totals[0].kwh);
  });
});
