/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { computeEnergy } from '@/lib/calc/energy';
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';

const build: BuildConfig = {
  id: 'b1',
  name: 't',
  components: {
    cpu: 'cpu-amd-ryzen-7-7800x3d',
    gpu: 'gpu-nvidia-rtx-4070',
    motherboard: 'mb-asus-rog-strix-x670e',
  },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', subdivision_code: 'IN-KL', manual_rate_override: 7.5 },
};

const workloads: Workload[] = [
  {
    id: 'office',
    name: 'Office',
    category: 'productivity',
    description: '',
    utilization: { cpu_pct: 0.2, gpu_pct: 0.05, ram_pct: 0.4, storage_pct: 0.1, monitor_w: 30 },
    benchmarks: [],
  },
];

describe('computeEnergy', () => {
  test('returns one row per schedule entry', () => {
    const r = computeEnergy(build, workloads, 'day');
    expect(r.perWorkload).toHaveLength(1);
  });

  test('applies manual rate override', () => {
    const r = computeEnergy(build, workloads, 'day');
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 7.5, 5);
  });

  test('monthly scales by 30.44, yearly by 365.25', () => {
    const d = computeEnergy(build, workloads, 'day').total.kwh;
    const m = computeEnergy(build, workloads, 'month').total.kwh;
    const y = computeEnergy(build, workloads, 'year').total.kwh;
    expect(m).toBeCloseTo(d * 30.44, 5);
    expect(y).toBeCloseTo(d * 365.25, 5);
  });
});
