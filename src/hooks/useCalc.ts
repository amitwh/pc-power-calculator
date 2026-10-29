import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { findComponent } from '@/lib/data/components';
import type { Component, PsuEfficiencyRating } from '@/types/component';
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';
import { computeEnergy, resolveBuildComponents, type PerWorkloadEnergy } from '@/lib/calc/energy';
import { componentPowerW, systemPowerW } from '@/lib/calc/power';
import { coercePsuRating, psuWattageFromSpecs, recommendPsuW } from '@/lib/calc/psu';
import { currencyForLocation } from '@/lib/data/tariffs';
import { listWorkloads } from '@/lib/data/workloads';
import type { CurrencyInfo } from '@/types/currency';

/** A component with its effective `tdp_w` after any per-build override. */
export type ResolvedComponent = Component & { effective_tdp_w: number | null };

export interface PeriodEnergy {
  kwh: number;
  cost: number;
  /** Per-workload rows for the active build; populated for daily/monthly/yearly
   *  inside `useCalc`, left undefined for aggregate sums across all builds. */
  perWorkload?: PerWorkloadEnergy[];
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
  /** Per-workload energy breakdown for the active build (yearly view). */
  perWorkload: PerWorkloadEnergy[];
  /** Pre-aggregated daily / monthly / yearly totals for the active build,
   *  plus per-workload rows for rendering perf metrics in the UI. */
  daily: PeriodEnergy;
  monthly: PeriodEnergy;
  yearly: PeriodEnergy;
  /** Component → typical 70% load wattage (for the power-breakdown chart). */
  componentsPowerW: Record<string, number>;
  /** Wall-side draw with every component at 100% utilization. */
  peakWallDrawW: number;
  /** Recommended PSU size for the peak draw (headroom included). */
  recommendedPsuW: number;
  /** Display currency: explicit override, else the tariff currency of the
   *  active build's location (₹ for India, $ for US, …). */
  currency: CurrencyInfo;
  /** Combined energy across ALL systems in the store. */
  allDaily: PeriodEnergy;
  allMonthly: PeriodEnergy;
  allYearly: PeriodEnergy;
}

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
    const psuWattage = psuComponent ? psuWattageFromSpecs(psuComponent.specs) : null;

    const totalEffectiveTdpW = resolved.reduce((acc, c) => acc + (c.effective_tdp_w ?? 0), 0);

    const rate = activeBuild.location.manual_rate_override;
    const daily = computeEnergy(activeBuild, workloads, 'day', rate, customPeripherals);
    const monthly = computeEnergy(activeBuild, workloads, 'month', rate, customPeripherals);
    const yearly = computeEnergy(activeBuild, workloads, 'year', rate, customPeripherals);

    const componentsPowerW: Record<string, number> = {};
    for (const c of resolved) {
      componentsPowerW[c.id] = componentPowerW(c, 0.7);
    }

    // PSU sizing: everything flat-out at 100%, measured at the wall.
    const { wallDrawW: peakWallDrawW } = systemPowerW(
      resolvedRaw,
      { cpu: 1, gpu: 1, ram: 1, storage: 1 },
      psuRating,
      psuWattage ?? 650,
    );
    const recommendedPsuW = recommendPsuW(peakWallDrawW);

    // Multi-system: sum energy across every build (each build auto-resolves
    // its own tariff unless it has a manual rate override).
    let allDaily = { kwh: 0, cost: 0 };
    let allMonthly = { kwh: 0, cost: 0 };
    let allYearly = { kwh: 0, cost: 0 };
    for (const b of builds) {
      const d = computeEnergy(b, workloads, 'day', undefined, customPeripherals).total;
      const m = computeEnergy(b, workloads, 'month', undefined, customPeripherals).total;
      const y = computeEnergy(b, workloads, 'year', undefined, customPeripherals).total;
      allDaily = { kwh: allDaily.kwh + d.kwh, cost: allDaily.cost + d.cost };
      allMonthly = { kwh: allMonthly.kwh + m.kwh, cost: allMonthly.cost + m.cost };
      allYearly = { kwh: allYearly.kwh + y.kwh, cost: allYearly.cost + y.cost };
    }

    const currency = currencyForLocation(
      activeBuild.location.country_iso2,
      activeBuild.location.subdivision_code,
      activeBuild.currency_override,
    );

    return {
      build: activeBuild,
      components: resolved,
      psuRating,
      psuWattage,
      totalEffectiveTdpW,
      perWorkload: yearly.perWorkload,
      daily: { ...daily.total, perWorkload: daily.perWorkload },
      monthly: { ...monthly.total, perWorkload: monthly.perWorkload },
      yearly: { ...yearly.total, perWorkload: yearly.perWorkload },
      componentsPowerW,
      peakWallDrawW,
      recommendedPsuW,
      currency,
      allDaily,
      allMonthly,
      allYearly,
    };
  }, [builds, activeBuildId, customPeripherals, workloads]);
}

/** Re-export so callers don't need to import the energy module directly. */
export { findComponent };
