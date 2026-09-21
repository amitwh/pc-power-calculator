import type { BuildConfig } from '@/types/build';
import type { Component, ComponentCategory } from '@/types/component';
import type { WorkloadId } from '@/types/workload';

export interface Suggestion {
  component_id: string;
  category: ComponentCategory;
  current: { tdp_w: number; perf_score: number };
  alternative: Component;
  alt: { tdp_w: number; perf_score: number };
  impact: { kwh_saved_per_year: number; cost_saved_per_year: number; perf_retention_pct: number };
}

const PERF_FLOOR = 0.90;
const PERF_BY_RELEASE_YEAR: Record<string, number> = {};
// Rough perf baseline per releaseYear. Better than nothing for v1;
// real benchmarks replace this in T13.
for (let y = 2018; y <= 2026; y++) PERF_BY_RELEASE_YEAR[String(y)] = 100 + (y - 2018) * 25;

function perfScore(c: Component): number {
  return PERF_BY_RELEASE_YEAR[String(c.releaseYear)] ?? 50;
}

/**
 * Pick a TDP override (if any) for the slot the component currently occupies.
 * Overrides are stored per-id (for peripherals) or per-slot (for single
 * instances like cpu/gpu). Returns null when there is no override.
 */
function overrideFor(
  build: BuildConfig,
  slotKey: string,
  componentId: string,
): number | null {
  const overrides = build.tdpOverrides ?? {};
  const byId = overrides[componentId];
  if (typeof byId === 'number' && Number.isFinite(byId)) return byId;
  const bySlot = overrides[slotKey];
  if (typeof bySlot === 'number' && Number.isFinite(bySlot)) return bySlot;
  return null;
}

export function suggestAlternatives(
  build: BuildConfig,
  components: Component[],
  // Reserved for T13: workload-specific perf floor / category-aware perf scoring.
  // The current v1 release-year baseline is workload-agnostic, so the value is
  // part of the API contract but not yet consulted in the engine.
  _workloadId: WorkloadId,
  hoursPerDay = 8,
  daysPerYear = 365,
  ratePerKwh = 7.5,
): Suggestion[] {
  const out: Suggestion[] = [];
  for (const [slot, id] of Object.entries(build.components)) {
    if (!id || Array.isArray(id)) continue;
    const current = components.find((c) => c.id === id);
    if (!current || current.tdp_w == null) continue;
    // Respect any per-slot or per-component TDP override the user has set;
    // the suggestion engine evaluates lower-power swaps against the actual
    // configured power draw, not the spec sheet.
    const currentTdp = overrideFor(build, slot, current.id) ?? current.tdp_w;
    const currentPerf = perfScore(current);
    const candidates = components
      .filter((c) => c.category === current.category && c.id !== current.id && c.tdp_w != null && c.tdp_w < currentTdp)
      .map((c) => ({ c, perf: perfScore(c) }))
      .filter((x) => x.perf >= currentPerf * PERF_FLOOR)
      .sort((a, b) => a.c.tdp_w! - b.c.tdp_w!)
      .slice(0, 3);
    for (const { c, perf } of candidates) {
      const deltaW = currentTdp - c.tdp_w!;
      const kwhSavedPerYear = (deltaW * hoursPerDay * daysPerYear) / 1000;
      const costSavedPerYear = kwhSavedPerYear * ratePerKwh;
      out.push({
        component_id: current.id,
        category: current.category,
        current: { tdp_w: currentTdp, perf_score: currentPerf },
        alternative: c,
        alt: { tdp_w: c.tdp_w!, perf_score: perf },
        impact: {
          kwh_saved_per_year: kwhSavedPerYear,
          cost_saved_per_year: costSavedPerYear,
          perf_retention_pct: (perf / currentPerf) * 100,
        },
      });
    }
  }
  return out;
}