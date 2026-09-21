import data from '@/data/currencies.json';
import type { CurrencyInfo } from '@/types/currency';

const list = (data as unknown as { currencies: CurrencyInfo[] }).currencies;

export function listCurrencies(): CurrencyInfo[] {
  return list;
}

export function findCurrency(code: string): CurrencyInfo | undefined {
  return list.find((c) => c.code === code);
}
