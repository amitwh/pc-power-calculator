import type { BuildConfig } from '@/types/build';
import type { Component, PsuEfficiencyRating } from '@/types/component';
import type { BenchmarkEntry, Workload, WorkloadId } from '@/types/workload';
import { findComponent } from '@/lib/data/components';
import { lookupBenchmark } from '@/lib/data/benchmarks';
import { systemPowerW } from './power';

export interface PerWorkloadEnergy {
  workload_id: WorkloadId;
  hours_per_day: number;
  draw_w: number;
  kwh: number;
  cost: number;
  perfMetrics: BenchmarkEntry[];
}

const DAYS_IN_MONTH = 30.44;
const DAYS_IN_YEAR = 365.25;

const PSU_RATINGS: ReadonlyArray<PsuEfficiencyRating> = [
  '80-plus',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'titanium',
];

const coerceRating = (s: string | undefined): PsuEfficiencyRating | null =>
  s && (PSU_RATINGS as readonly string[]).includes(s) ? (s as PsuEfficiencyRating) : null;

const coercePsuWattage = (specs: Component['specs']): number | null => {
  const w = Number(specs.wattage ?? specs.watts ?? NaN);
  return Number.isFinite(w) && w > 0 ? w : null;
};

interface SlotDef {
  key: keyof BuildConfig['components'];
  isArray: boolean;
}

const SLOT_DEFS: SlotDef[] = [
  { key: 'cpu', isArray: false },
  { key: 'gpu', isArray: false },
  { key: 'motherboard', isArray: false },
  { key: 'psu', isArray: false },
  { key: 'cooler', isArray: false },
  { key: 'ups', isArray: false },
  { key: 'ram', isArray: true },
  { key: 'storage', isArray: true },
  { key: 'monitors', isArray: true },
  { key: 'add_in_cards', isArray: true },
  { key: 'optical_drives', isArray: true },
  { key: 'peripherals', isArray: true },
];

/**
 * Resolve every component id in a build to a Component, applying TDP overrides
 * (keyed by component id for peripherals, by slot name for single-instance parts).
 * Drops any id that can't be resolved.
 */
export function resolveBuildComponents(
  build: BuildConfig,
  customPeripherals: Component[] = [],
): Component[] {
  const customById = new Map(customPeripherals.map((c) => [c.id, c]));
  const overrides = build.tdpOverrides ?? {};
  const out: Component[] = [];
  for (const slot of SLOT_DEFS) {
    const slotValue = build.components[slot.key];
    const ids = slot.isArray
      ? Array.isArray(slotValue) ? slotValue : []
      : slotValue
        ? [slotValue as string]
        : [];
    for (const id of ids) {
      if (!id) continue;
      const raw = customById.get(id) ?? findComponent(id);
      if (!raw) continue;
      const override = overrides[id] ?? overrides[slot.key];
      out.push(override != null ? { ...raw, tdp_w: override } : raw);
    }
  }
  return out;
}

export function computeEnergy(
  build: BuildConfig,
  workloads: Workload[],
  period: 'day' | 'month' | 'year',
  tariffRateOverride?: number,
  customPeripherals: Component[] = [],
): { perWorkload: PerWorkloadEnergy[]; total: { kwh: number; cost: number } } {
  const factor = period === 'day' ? 1 : period === 'month' ? DAYS_IN_MONTH : DAYS_IN_YEAR;

  const comps = resolveBuildComponents(build, customPeripherals);
  const psu = comps.find((c) => c.category === 'psu');
  const rating = psu ? coerceRating(String(psu.specs.rating ?? psu.specs.efficiency ?? '')) : null;
  const psuWattage = psu ? coercePsuWattage(psu.specs) ?? 650 : 650;

  const rows: PerWorkloadEnergy[] = [];
  let totalKwh = 0;

  for (const s of build.schedule) {
    if (s.hours_per_day <= 0) continue;
    const wl = workloads.find((w) => w.id === s.workload_id);
    if (!wl) continue;

    const { wallDrawW } = systemPowerW(
      comps,
      {
        cpu: wl.utilization.cpu_pct,
        gpu: wl.utilization.gpu_pct,
        ram: wl.utilization.ram_pct,
        storage: wl.utilization.storage_pct,
      },
      rating,
      psuWattage,
    );

    const dailyKwh = (wallDrawW * s.hours_per_day) / 1000;
    const periodKwh = dailyKwh * factor;

    const ratePerKwh = tariffRateOverride ?? build.location.manual_rate_override ?? 0;
    const cost = ratePerKwh * periodKwh;

    const gpuId = build.components.gpu;
    const cpuId = build.components.cpu;
    const perf: BenchmarkEntry[] = [];
    if (gpuId) perf.push(...lookupBenchmark(gpuId, s.workload_id));
    if (cpuId) perf.push(...lookupBenchmark(cpuId, s.workload_id));

    rows.push({
      workload_id: s.workload_id,
      hours_per_day: s.hours_per_day,
      draw_w: wallDrawW,
      kwh: periodKwh,
      cost,
      perfMetrics: perf,
    });
    totalKwh += periodKwh;
  }

  const totalRate = tariffRateOverride ?? build.location.manual_rate_override ?? 0;
  const totalCost = totalRate * totalKwh;
  return { perWorkload: rows, total: { kwh: totalKwh, cost: totalCost } };
}
