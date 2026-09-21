import type { TariffRate, TaxRule } from '@/types/tariff';

export interface CostBreakdown {
  subtotal: number;
  taxBreakdown: Record<string, number>;
  total: number;
}

export function computeCost(energyKwh: number, tariff: TariffRate, taxes: TaxRule[]): CostBreakdown {
  let subtotal = 0;
  if (tariff.flat != null) {
    subtotal = energyKwh * tariff.flat;
  } else if (tariff.slabs) {
    let remaining = energyKwh;
    let consumed = 0;
    for (const slab of tariff.slabs) {
      const cap = slab.upTo_kwh == null ? Infinity : slab.upTo_kwh - consumed;
      const use = Math.min(remaining, cap);
      subtotal += use * slab.rate;
      consumed += use;
      remaining -= use;
      if (remaining <= 0) break;
    }
  }
  const taxBreakdown: Record<string, number> = {};
  let total = subtotal;
  for (const t of taxes) {
    // `appliesTo: 'energy'` taxes (e.g. renewable surcharges, fixed per-kWh fees)
    // are computed on the energy subtotal, NOT on the running total — otherwise
    // they'd compound on top of themselves and on top of other taxes.
    const base = t.appliesTo === 'energy' ? subtotal : total;
    const amount = base * (t.rate_pct / 100);
    taxBreakdown[t.name] = amount;
    total += amount;
  }
  return { subtotal, taxBreakdown, total };
}

export function effectiveRate(energyKwh: number, tariff: TariffRate): number {
  if (energyKwh <= 0) return tariff.flat ?? 0;
  if (tariff.flat != null) return tariff.flat;
  const { subtotal } = computeCost(energyKwh, tariff, []);
  return subtotal / energyKwh;
}
