/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { CASE_FANS_ID, CASE_FAN_WATTS, computeEnergy, resolveBuildComponents } from '@/lib/calc/energy';
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

  test('attaches benchmark entries for known GPU + workload', () => {
    const r = computeEnergy(
      {
        ...build,
        components: { ...build.components, gpu: 'gpu-nvidia-rtx-4070' },
        schedule: [{ workload_id: 'gaming_1080p', hours_per_day: 4 }],
      },
      workloads.map((w) => ({ ...w, id: 'gaming_1080p', utilization: { ...w.utilization, cpu_pct: 0.4, gpu_pct: 0.95 } })),
      'day',
    );
    const gamingRow = r.perWorkload.find((x) => x.workload_id === 'gaming_1080p');
    expect(gamingRow?.perfMetrics.length).toBeGreaterThan(0);
  });
});

describe('resolveBuildComponents — overclock + case fans', () => {
  test('no overclock/case_fans fields → stock TDPs, no fan component', () => {
    const out = resolveBuildComponents(build);
    const cpu = out.find((c) => c.category === 'cpu');
    expect(cpu?.tdp_w).toBe(120); // 7800X3D rated TDP
    expect(out.find((c) => c.id === CASE_FANS_ID)).toBeUndefined();
  });

  test('CPU overclock scales the CPU TDP only', () => {
    const out = resolveBuildComponents({ ...build, overclock: { cpu_pct: 20, gpu_pct: 0 } });
    const cpu = out.find((c) => c.category === 'cpu');
    const gpu = out.find((c) => c.category === 'gpu');
    expect(cpu?.tdp_w).toBeCloseTo(144, 5); // 120 × 1.2
    expect(gpu?.tdp_w).toBe(200); // RTX 4070 untouched
  });

  test('GPU overclock scales the GPU TDP only', () => {
    const out = resolveBuildComponents({ ...build, overclock: { cpu_pct: 0, gpu_pct: 10 } });
    expect(out.find((c) => c.category === 'cpu')?.tdp_w).toBe(120);
    expect(out.find((c) => c.category === 'gpu')?.tdp_w).toBeCloseTo(220, 5); // 200 × 1.1
  });

  test('overclock does not mutate the catalog entry', () => {
    const before = resolveBuildComponents(build).find((c) => c.category === 'cpu')?.tdp_w;
    resolveBuildComponents({ ...build, overclock: { cpu_pct: 50, gpu_pct: 50 } });
    const after = resolveBuildComponents(build).find((c) => c.category === 'cpu')?.tdp_w;
    expect(after).toBe(before);
  });

  test('case fans synthesize a constant-draw peripheral', () => {
    const out = resolveBuildComponents({ ...build, case_fans: 4 });
    const fans = out.find((c) => c.id === CASE_FANS_ID);
    expect(fans).toBeDefined();
    expect(fans?.tdp_w).toBe(4 * CASE_FAN_WATTS);
  });

  test('negative/undefined case_fans is clamped or omitted', () => {
    expect(resolveBuildComponents({ ...build, case_fans: -3 }).find((c) => c.id === CASE_FANS_ID)).toBeUndefined();
    expect(resolveBuildComponents(build).find((c) => c.id === CASE_FANS_ID)).toBeUndefined();
  });
});
