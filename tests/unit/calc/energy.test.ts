/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { CASE_FANS_ID, CASE_FAN_WATTS, computeEnergy, resolveBuildComponents, resolveRatePerKwh } from '@/lib/calc/energy';
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

  test('days_per_week scales consumption (office 5d/wk = 5/7 full-time)', () => {
    const fiveDays: BuildConfig = {
      ...build,
      schedule: [{ workload_id: 'office', hours_per_day: 8, days_per_week: 5 }],
    };
    const sevenDays: BuildConfig = {
      ...build,
      schedule: [{ workload_id: 'office', hours_per_day: 8, days_per_week: 7 }],
    };
    const a = computeEnergy(fiveDays, workloads, 'year').total.kwh;
    const b = computeEnergy(sevenDays, workloads, 'year').total.kwh;
    expect(b).toBeGreaterThan(0);
    expect(a).toBeCloseTo(b * (5 / 7), 5);
  });

  test('missing days_per_week defaults to 7 days', () => {
    const implicit = computeEnergy(build, workloads, 'year').total.kwh;
    const explicit: BuildConfig = {
      ...build,
      schedule: build.schedule.map((s) => ({ ...s, days_per_week: 7 })),
    };
    expect(implicit).toBeCloseTo(computeEnergy(explicit, workloads, 'year').total.kwh, 5);
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

describe('tariff resolution', () => {
  // Same hardware as `build`, but no manual rate override — the engine must
  // fall back to the bundled tariff schedule for the build's location.
  const buildNoRate: BuildConfig = { ...build, location: { country_iso2: 'IN' } };

  test('bundled tariff applies when no manual override (IN: ₹6.50 + 8% duty)', () => {
    const r = computeEnergy(buildNoRate, workloads, 'day');
    expect(r.total.kwh).toBeGreaterThan(0);
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 6.5 * 1.08, 5);
  });

  test('country rates apply as bundled (GB: 26p/kWh Ofgem cap, VAT included)', () => {
    const r = computeEnergy({ ...buildNoRate, location: { country_iso2: 'GB' } }, workloads, 'day');
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 0.26, 5);
  });

  test('monthly slabs walk on the monthly-equivalent consumption (Kerala)', () => {
    // Kerala KSEB 2025-27: first 50 kWh/month at ₹2.90, plus the country's 8% duty. A
    // low-draw build whose monthly use stays under 50 kWh bills entirely at
    // the first slab rate.
    const r = computeEnergy(
      { ...buildNoRate, location: { country_iso2: 'IN', subdivision_code: 'IN-KL' } },
      workloads,
      'month',
    );
    expect(r.total.kwh).toBeLessThan(50);
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 2.9 * 1.08, 5);
  });

  test('heavier usage crosses into higher slabs (Kerala)', () => {
    // 24/7 server on this hardware lands in the 50–150 kWh slab, so the
    // effective rate must exceed the first slab rate (×duty) but stay well
    // below the top slab.
    const heavy: BuildConfig = {
      ...buildNoRate,
      location: { country_iso2: 'IN', subdivision_code: 'IN-KL' },
      schedule: [{ workload_id: 'server_heavy', hours_per_day: 24 }],
    };
    const wl: Workload = {
      id: 'server_heavy',
      name: 'Server heavy',
      category: 'server',
      description: '',
      utilization: { cpu_pct: 0.9, gpu_pct: 0, ram_pct: 0.8, storage_pct: 0.6, monitor_w: 0 },
      benchmarks: [],
    };
    const r = computeEnergy(heavy, [wl], 'month');
    const effective = r.total.cost / r.total.kwh;
    expect(r.total.kwh).toBeGreaterThan(50);
    expect(effective).toBeGreaterThan(2.9 * 1.08);
    expect(effective).toBeLessThan(7.7 * 1.08); // slab average, never the top rate alone
  });

  test('manual override still wins over the bundled tariff', () => {
    const r = computeEnergy(build, workloads, 'day'); // `build` has manual_rate_override 7.5
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 7.5, 5);
  });

  test('explicit override parameter wins over everything', () => {
    const r = computeEnergy(build, workloads, 'day', 10);
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 10, 5);
  });

  test('resolveRatePerKwh returns the flat rate directly', () => {
    expect(resolveRatePerKwh({ ...buildNoRate, location: { country_iso2: 'US' } }, 100, 'month')).toBe(0.18);
  });
});
