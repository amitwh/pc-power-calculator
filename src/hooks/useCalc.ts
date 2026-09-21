import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { findComponent } from '@/lib/data/components';
import type { Component, PsuEfficiencyRating } from '@/types/component';
import type { BuildConfig } from '@/types/build';

/** A component with its effective `tdp_w` after any per-build override. */
export type ResolvedComponent = Component & { effective_tdp_w: number | null };

export interface CalcInputs {
  build: BuildConfig;
  components: ResolvedComponent[];
  psuRating: PsuEfficiencyRating | null;
  psuWattage: number | null;
  /** Sum of effective TDPs across active components (best-effort, ignores peripherals and PSUs). */
  totalEffectiveTdpW: number;
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

/**
 * Hook that bridges the build store → calc engine.
 *
 * - Resolves the active build's component ids against the catalog and the
 *   user-defined `customPeripherals` list.
 * - Applies per-build TDP overrides (keyed by slot for single-instance parts,
 *   by component id for peripherals).
 * - Returns enough context for the calc engine to compute energy and cost.
 *
 * Consumers (T6) layer in the per-workload schedule + tariff + tax.
 */
export function useCalc(): CalcInputs {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const customPeripherals = useBuildStore((s) => s.customPeripherals);

  return useMemo(() => {
    const build = builds.find((b) => b.id === activeBuildId);
    if (!build) {
      return {
        build: {
          id: '',
          name: '',
          components: {},
          tdpOverrides: {},
          schedule: [],
          location: { country_iso2: 'IN' },
        } as BuildConfig,
        components: [],
        psuRating: null,
        psuWattage: null,
        totalEffectiveTdpW: 0,
      };
    }

    const customById = new Map(customPeripherals.map((c) => [c.id, c]));
    const overrides = build.tdpOverrides;
    const slots = build.components;

    const resolved: ResolvedComponent[] = [];
    const addResolved = (id: string, slotKey: string) => {
      const raw = customById.get(id) ?? findComponent(id);
      if (!raw) return;
      // Override lookup: prefer component-id key (so per-peripheral overrides
      // work), fall back to slot key (for single-instance slots like cpu/gpu).
      const overrideVal: number | undefined = overrides[id] ?? overrides[slotKey];
      const effective_tdp_w: number | null =
        overrideVal != null ? overrideVal : raw.tdp_w;
      resolved.push({ ...raw, effective_tdp_w });
    };

    if (slots.cpu) addResolved(slots.cpu, 'cpu');
    if (slots.gpu) addResolved(slots.gpu, 'gpu');
    if (slots.motherboard) addResolved(slots.motherboard, 'motherboard');
    if (slots.psu) addResolved(slots.psu, 'psu');
    if (slots.cooler) addResolved(slots.cooler, 'cooler');
    if (slots.ups) addResolved(slots.ups, 'ups');
    (slots.ram ?? []).forEach((id) => addResolved(id, 'ram'));
    (slots.storage ?? []).forEach((id) => addResolved(id, 'storage'));
    (slots.monitors ?? []).forEach((id) => addResolved(id, 'monitor'));
    (slots.add_in_cards ?? []).forEach((id) => addResolved(id, 'add_in_card'));
    (slots.optical_drives ?? []).forEach((id) => addResolved(id, 'optical_drive'));
    (slots.peripherals ?? []).forEach((id) => addResolved(id, id));

    const psuComponent = resolved.find((c) => c.category === 'psu') ?? null;
    const psuRating = psuComponent ? coercePsuRating(String(psuComponent.specs.rating ?? '')) : null;
    const psuWattage = psuComponent ? coercePsuWattage(psuComponent.specs) : null;

    const totalEffectiveTdpW = resolved.reduce((acc, c) => acc + (c.effective_tdp_w ?? 0), 0);

    return { build, components: resolved, psuRating, psuWattage, totalEffectiveTdpW };
  }, [builds, activeBuildId, customPeripherals]);
}
