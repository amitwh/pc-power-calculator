import type { BuildConfig } from '@/types/build';
import type { Component } from '@/types/component';
import type { BenchmarkEntry, Workload, WorkloadId } from '@/types/workload';
import { findComponent } from '@/lib/data/components';
import { lookupBenchmark } from '@/lib/data/benchmarks';
import { resolveLocationTariff } from '@/lib/data/tariffs';
import { coercePsuRating, psuWattageFromSpecs } from './psu';
import { computeCost } from './cost';
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
  { key: 'fans', isArray: true },
];

/** Modeled draw of one 120/140 mm case fan at normal PWM. */
export const CASE_FAN_WATTS = 2;

/** Synthetic id for the case-fan aggregate component. */
export const CASE_FANS_ID = 'case-fans';

/**
 * Resolve every component id in a build to a Component, applying TDP overrides
 * (keyed by component id for peripherals, by slot name for single-instance parts)
 * and the build's CPU/GPU overclock. Each component appears once per selected
 * unit (see `build.quantities`). Appends a synthetic constant-draw component
 * for the build's case fans. Drops any id that can't be resolved.
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
      const qty = Math.max(1, Math.min(999, Math.round(build.quantities?.[id] ?? 1)));
      for (let i = 0; i < qty; i++) {
        out.push(override != null ? { ...raw, tdp_w: override } : raw);
      }
    }
  }

  // Overclock: extra TDP on top of the part's rated power.
  const oc = build.overclock;
  if (oc) {
    if (oc.cpu_pct > 0) {
      for (let i = 0; i < out.length; i++) {
        const c = out[i];
        if (c.category === 'cpu' && c.tdp_w != null) {
          out[i] = { ...c, tdp_w: c.tdp_w * (1 + oc.cpu_pct / 100) };
        }
      }
    }
    if (oc.gpu_pct > 0) {
      for (let i = 0; i < out.length; i++) {
        const c = out[i];
        if (c.category === 'gpu' && c.tdp_w != null) {
          out[i] = { ...c, tdp_w: c.tdp_w * (1 + oc.gpu_pct / 100) };
        }
      }
    }
  }

  // Case fans: one aggregate constant-draw component.
  const fans = Math.max(0, Math.round(build.case_fans ?? 0));
  if (fans > 0) {
    const watts = Math.round(fans * CASE_FAN_WATTS * 10) / 10;
    out.push({
      id: CASE_FANS_ID,
      category: 'peripheral',
      brand: 'Generic',
      model: `Case fans ×${fans}`,
      releaseYear: new Date().getFullYear(),
      tdp_w: watts,
      specs: { type: 'case-fans', watts },
      source: 'derived',
      addedAt: '2026-10-29',
    });
  }
  return out;
}

/**
 * Cost rate for a build, in currency units per kWh.
 *
 * An explicit `tariffRateOverride` (or the build's manual override) wins as a
 * flat rate. Otherwise the bundled tariff schedule for the build's location is
 * used — including tiered slabs and applicable taxes. Slabs are billed per
 * MONTH, so the effective rate is derived by walking the slabs on the build's
 * monthly consumption and averaging back to a per-kWh rate.
 */
export function resolveRatePerKwh(
  build: BuildConfig,
  periodKwh: number,
  period: 'day' | 'month' | 'year',
  tariffRateOverride?: number,
): number {
  const override = tariffRateOverride ?? build.location.manual_rate_override;
  if (override != null) return override;

  const { rate, taxes } = resolveLocationTariff(
    build.location.country_iso2,
    build.location.subdivision_code,
  );

  // Convert this period's consumption to its monthly equivalent (slabs and
  // taxes are billed per month), walk the slabs on that, and average back
  // down to a per-kWh rate for the rows.
  const monthsPerPeriod = period === 'day' ? DAYS_IN_MONTH : period === 'year' ? 1 / 12 : 1;
  const kwhPerMonth = periodKwh * monthsPerPeriod;
  if (kwhPerMonth <= 0) return rate.flat ?? rate.slabs?.[0]?.rate ?? 0;
  if (rate.flat != null && taxes.length === 0) return rate.flat;
  const { total } = computeCost(kwhPerMonth, rate, taxes);
  return total / kwhPerMonth;
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
  const rating = psu
    ? coercePsuRating(psu.specs.rating ?? psu.specs.efficiency)
    : null;
  const psuWattage = psu ? psuWattageFromSpecs(psu.specs) ?? 650 : 650;

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

    const dailyKwh = (wallDrawW * s.hours_per_day * (s.days_per_week ?? 7)) / (1000 * 7);
    const periodKwh = dailyKwh * factor;

    const perf: BenchmarkEntry[] = [];
    const gpuId = build.components.gpu;
    const cpuId = build.components.cpu;
    if (gpuId) perf.push(...lookupBenchmark(gpuId, s.workload_id));
    if (cpuId) perf.push(...lookupBenchmark(cpuId, s.workload_id));

    rows.push({
      workload_id: s.workload_id,
      hours_per_day: s.hours_per_day,
      draw_w: wallDrawW,
      kwh: periodKwh,
      cost: 0, // filled in below once the period total (and thus slab rate) is known
      perfMetrics: perf,
    });
    totalKwh += periodKwh;
  }

  const ratePerKwh = resolveRatePerKwh(build, totalKwh, period, tariffRateOverride);
  for (const row of rows) row.cost = row.kwh * ratePerKwh;
  const totalCost = totalKwh * ratePerKwh;
  return { perWorkload: rows, total: { kwh: totalKwh, cost: totalCost } };
}
