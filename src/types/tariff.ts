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
}

export interface TariffSchedule {
  country_iso2: string;
  country_name: string;
  subdivisions?: TariffDivision[];
  default: TariffRate;
  applicableTaxes?: TaxRule[];
  notes?: string;
  /**
   * Per-country data freshness. Optional because the bundled tariff snapshot
   * publishes a single top-level `lastUpdated` instead; the loader exposes
   * that via `dataLastUpdated()`.
   */
  lastUpdated?: string;
}
