export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalDigits: number;
}

/**
 * Snapshot of exchange rates. `base` is the currency `rates` are quoted against
 * (e.g. 1 USD = X INR); `date` is the ISO calendar date the snapshot was
 * captured; `source` records where the rates came from (e.g. `bundled`,
 * `cbr`). Live FX fetches were removed in ce8741e — only the bundled snapshot
 * ships with the app.
 */
export interface FxSnapshot {
  base: string;
  date: string;
  rates: Record<string, number>;
  source: string;
}
