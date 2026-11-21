export interface TariffSlab {
  upTo_kwh: number | null;
  rate: number;
}

export interface TariffRate {
  flat?: number;
  currency: string;
  slabs?: TariffSlab[];
}

export interface TaxRule {
  name: string;
  rate_pct: number;
  appliesTo?: 'energy' | 'total';
}

export interface TariffDivision {
  code: string;
  name: string;
  rate: TariffRate;
  /** Caveat specific to this subdivision, e.g. the DISCOM order it came from. */
  notes?: string;
}

export interface TariffSchedule {
  country_iso2: string;
  country_name: string;
  subdivisions?: TariffDivision[];
  default: TariffRate;
  applicableTaxes?: TaxRule[];
  notes?: string;
  /** Where the rate came from, shown to the visitor next to the figure. */
  rateSource?: string;
  /** ISO date the rate was checked or last compiled. */
  rateUpdated?: string;
  /**
   * True when the figure is a banded average or regional estimate rather than
   * a verified tariff for a specific distributor. The UI marks these with `*`.
   */
  rateEstimated?: boolean;
  /**
   * Per-country data freshness. Optional because the bundled tariff snapshot
   * publishes a single top-level `lastUpdated` instead; the loader exposes
   * that via `dataLastUpdated()`.
   */
  lastUpdated?: string;
}
