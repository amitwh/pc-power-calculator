import type { CurrencyInfo } from '@/types/currency';

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
