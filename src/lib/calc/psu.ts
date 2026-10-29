import powerProfiles from '@/data/power_profiles.json';
import type { PsuEfficiencyRating } from '@/types/component';

const curves = powerProfiles.psuCurves as Record<PsuEfficiencyRating, Array<{ load_pct: number; efficiency: number }>>;

const RATING_VALUES: ReadonlyArray<PsuEfficiencyRating> = [
  'none', '80-plus', 'bronze', 'silver', 'gold', 'platinum', 'titanium',
];

/**
 * Normalize a PSU spec string from the catalog ("Gold", "80 plus", "80-plus")
 * to a canonical rating. Unrecognized values (missing/typos) return null.
 */
export function coercePsuRating(value: unknown): PsuEfficiencyRating | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '-');
  return (RATING_VALUES as readonly string[]).includes(normalized)
    ? (normalized as PsuEfficiencyRating)
    : null;
}

/** Read the PSU's rated wattage from catalog specs (accepts wattage_w/wattage/watts). */
export function psuWattageFromSpecs(specs: Record<string, unknown>): number | null {
  const w = Number(specs.wattage_w ?? specs.wattage ?? specs.watts ?? NaN);
  return Number.isFinite(w) && w > 0 ? w : null;
}

export function psuEfficiency(rating: PsuEfficiencyRating, loadPct: number): number {
  const curve = curves[rating];
  const clamped = Math.min(100, Math.max(10, loadPct));
  // Find adjacent reference points and interpolate.
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (clamped >= a.load_pct && clamped <= b.load_pct) {
      const t = (clamped - a.load_pct) / (b.load_pct - a.load_pct);
      return a.efficiency + t * (b.efficiency - a.efficiency);
    }
  }
  return curve[curve.length - 1].efficiency;
}

export function wallDrawW(componentDrawW: number, rating: PsuEfficiencyRating | null, loadPct: number): number {
  const eff = rating ? psuEfficiency(rating, loadPct) : 0.85;
  if (eff <= 0) return componentDrawW;
  return componentDrawW / eff;
}

/** Standard PSU wattage steps most consumer units are sold in. */
const STANDARD_PSU_WATTS = [
  300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 850, 1000, 1100, 1200, 1300, 1500, 1600, 2000,
];

/**
 * Recommended PSU size for a peak component draw: +35% headroom for transient
 * spikes, capacitor aging and the efficiency sweet spot, rounded up to the
 * nearest standard rating.
 */
export function recommendPsuW(peakComponentDrawW: number): number {
  const target = Math.max(0, peakComponentDrawW) * 1.35;
  return STANDARD_PSU_WATTS.find((w) => w >= target) ?? Math.ceil(target / 100) * 100;
}
