import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { findComponent } from '@/lib/data/components';
import type { Component, PsuEfficiencyRating } from '@/types/component';
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';
import { computeEnergy, resolveBuildComponents, type PerWorkloadEnergy } from '@/lib/calc/energy';
import { componentPowerW } from '@/lib/calc/power';
import { listWorkloads } from '@/lib/data/workloads';

/** A component with its effective `tdp_w` after any per-build override. */
export type ResolvedComponent = Component & { effective_tdp_w: number | null };

export interface PeriodEnergy {
  kwh: number;
  cost: number;
}

export interface CalcInputs {
  build: BuildConfig;
  components: ResolvedComponent[];
  psuRating: PsuEfficiencyRating | null;
  psuWattage: number | null;
  /** Sum of effective TDPs across active components (best-effort, ignores peripherals and PSUs). */
  totalEffectiveTdpW: number;
}

export interface CalcResult extends CalcInputs {
  /** Per-workload energy breakdown for the active build. */
  perWorkload: PerWorkloadEnergy[];
  /** Pre-aggregated daily / monthly / yearly totals for the active build. */
  daily: PeriodEnergy;
  monthly: PeriodEnergy;
  yearly: PeriodEnergy;
  /** Component → typical 70% load wattage (for the power-breakdown chart). */
  componentsPowerW: Record<string, number>;
  /** Combined energy across ALL systems in the store. */
  allDaily: PeriodEnergy;
  allMonthly: PeriodEnergy;
  allYearly: PeriodEnergy;
}

const PSU_RATINGS: ReadonlyArray<PsuEfficiencyRating> = [
  '80-plus',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'titanium',
];

const coercePsuRating = (s: string | undefined): PsuEfficiencyRating | null =>
  s && (PSU_RATINGS as readonly string[]).includes(s) ? (s as PsuEfficiencyRating) : null;

const coercePsuWattage = (specs: Component['specs']): number | null => {
  const w = Number(specs.wattage ?? specs.watts ?? NaN);
  return Number.isFinite(w) && w > 0 ? w : null;
};

const EMPTY_BUILD: BuildConfig = {
  id: '',
  name: '',
  components: {},
  tdpOverrides: {},
  schedule: [],
  location: { country_iso2: 'IN' },
};

const toResolved = (c: Component): ResolvedComponent => ({ ...c, effective_tdp_w: c.tdp_w });

/**
 * Bridge between the build store and the calc engine.
 *
 * Returns:
 *  - resolved components for the ACTIVE build (with TDP overrides applied);
 *  - pre-computed daily / monthly / yearly energy for the active build;
 *  - per-component typical-load wattage for the power-breakdown chart;
 *  - combined daily / monthly / yearly energy across ALL systems in the store.
 */
export function useCalc(): CalcResult {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const customPeripherals = useBuildStore((s) => s.customPeripherals);

  const workloads: Workload[] = useMemo(() => listWorkloads(), []);

  return useMemo<CalcResult>(() => {
    const activeBuild = builds.find((b) => b.id === activeBuildId) ?? EMPTY_BUILD;
    const resolvedRaw = resolveBuildComponents(activeBuild, customPeripherals);
    const resolved: ResolvedComponent[] = resolvedRaw.map(toResolved);

    const psuComponent = resolvedRaw.find((c) => c.category === 'psu') ?? null;
    const psuRating = psuComponent
      ? coercePsuRating(String(psuComponent.specs.rating ?? psuComponent.specs.efficiency ?? ''))
      : null;
    const psuWattage = psuComponent ? coercePsuWattage(psuComponent.specs) : null;

    const totalEffectiveTdpW = resolved.reduce((acc, c) => acc + (c.effective_tdp_w ?? 0), 0);

    const rate = activeBuild.location.manual_rate_override;
    const daily = computeEnergy(activeBuild, workloads, 'day', rate, customPeripherals);
    const monthly = computeEnergy(activeBuild, workloads, 'month', rate, customPeripherals);
    const yearly = computeEnergy(activeBuild, workloads, 'year', rate, customPeripherals);

    const componentsPowerW: Record<string, number> = {};
    for (const c of resolved) {
      componentsPowerW[c.id] = componentPowerW(c, 0.7);
    }

    // Multi-system: sum energy across every build.
    let allDaily = { kwh: 0, cost: 0 };
    let allMonthly = { kwh: 0, cost: 0 };
    let allYearly = { kwh: 0, cost: 0 };
    for (const b of builds) {
      const r = b.location.manual_rate_override;
      allDaily = {
        kwh: allDaily.kwh + computeEnergy(b, workloads, 'day', r, customPeripherals).total.kwh,
        cost: allDaily.cost + computeEnergy(b, workloads, 'day', r, customPeripherals).total.cost,
      };
      allMonthly = {
        kwh: allMonthly.kwh + computeEnergy(b, workloads, 'month', r, customPeripherals).total.kwh,
        cost: allMonthly.cost + computeEnergy(b, workloads, 'month', r, customPeripherals).total.cost,
      };
      allYearly = {
        kwh: allYearly.kwh + computeEnergy(b, workloads, 'year', r, customPeripherals).total.kwh,
        cost: allYearly.cost + computeEnergy(b, workloads, 'year', r, customPeripherals).total.cost,
      };
    }

    return {
      build: activeBuild,
      components: resolved,
      psuRating,
      psuWattage,
      totalEffectiveTdpW,
      perWorkload: yearly.perWorkload,
      daily: daily.total,
      monthly: monthly.total,
      yearly: yearly.total,
      componentsPowerW,
      allDaily,
      allMonthly,
      allYearly,
    };
  }, [builds, activeBuildId, customPeripherals, workloads]);
}

/** Re-export so callers don't need to import the energy module directly. */
export { findComponent };
