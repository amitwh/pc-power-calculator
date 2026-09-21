import powerProfiles from '@/data/power_profiles.json';
import type { PsuEfficiencyRating } from '@/types/component';

const curves = powerProfiles.psuCurves as Record<PsuEfficiencyRating, Array<{ load_pct: number; efficiency: number }>>;

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
