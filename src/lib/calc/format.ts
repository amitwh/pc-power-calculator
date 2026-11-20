import type { CurrencyInfo } from '@/types/currency';
import type { TariffRate } from '@/types/tariff';

export function formatCost(amount: number, currency: CurrencyInfo): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: currency.decimalDigits,
    minimumFractionDigits: currency.decimalDigits,
  }).format(amount);
}

export function formatKwh(kwh: number, decimals = 1, locale = 'en-IN'): string {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(kwh)} kWh`;
}

/**
 * One-line summary of a tariff's structure for prose and meta descriptions,
 * e.g. "₹5.67/kWh up to 100 kWh/month, ₹9.90/kWh up to 300 kWh/month and
 * ₹11.00/kWh above 300 kWh/month".
 */
export function describeTariffRate(rate: TariffRate, currency: CurrencyInfo): string {
  if (rate.flat != null) return `${formatCost(rate.flat, currency)}/kWh flat`;

  // Caps are cumulative, so middle slabs are bands: "101–300 kWh/month",
  // never "up to 300" — which would read as every unit at that rate.
  const slabs = rate.slabs ?? [];
  const parts = slabs.map((slab, i) => {
    const prevUpTo = slabs[i - 1]?.upTo_kwh ?? 0;
    if (slab.upTo_kwh == null) {
      return `${formatCost(slab.rate, currency)}/kWh above ${prevUpTo} kWh/month`;
    }
    if (i === 0) return `${formatCost(slab.rate, currency)}/kWh up to ${slab.upTo_kwh} kWh/month`;
    return `${formatCost(slab.rate, currency)}/kWh for ${prevUpTo + 1}–${slab.upTo_kwh} kWh/month`;
  });

  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
