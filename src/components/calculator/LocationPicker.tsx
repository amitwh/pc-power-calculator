import { useBuildStore } from '@/store/buildStore';
import { listCountries, listSubdivisions, effectiveRateForCountry, tariffsLastUpdated } from '@/lib/data/tariffs';
import { findCurrency } from '@/lib/data/currencies';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFx } from '@/hooks/useFx';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { effectiveRate } from '@/lib/calc/cost';
import type { CurrencyInfo } from '@/types/currency';

const DEFAULT_INR: CurrencyInfo = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  decimalDigits: 2,
};

export function LocationPicker() {
  const { loading, detect } = useGeolocation();
  const { snapshot, isLive } = useFx();
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const build = builds.find((b) => b.id === activeBuildId);
  const setLocation = useBuildStore((s) => s.setLocation);
  const setManualRate = useBuildStore((s) => s.setManualRate);

  // Currency follows the active build's override; falls back to INR.
  // Mirrors the same pattern in src/components/calculator/ExportMenu.tsx
  // so a US/EU user sees their own currency here (not a stray ₹).
  const currency = findCurrency(build?.currency_override ?? '') ?? DEFAULT_INR;

  const countries = listCountries();
  const subdivisions = listSubdivisions(build?.location.country_iso2 ?? '');
  const countryIso2 = build?.location.country_iso2 ?? 'IN';
  const subdivisionCode = build?.location.subdivision_code;
  const manualOverride = build?.location.manual_rate_override;
  const rate =
    manualOverride ??
    effectiveRate(200, effectiveRateForCountry(countryIso2, subdivisionCode));

  return (
    <Card>
      <CardTitle>2. Location & Tariff</CardTitle>
      <div className="space-y-3">
        <Select
          aria-label="Country"
          value={countryIso2}
          options={countries.map((c) => ({ value: c.iso2, label: `${c.name} (${c.iso2})` }))}
          onChange={(e) => setLocation(e.target.value)}
        />
        {subdivisions.length > 0 && (
          <Select
            aria-label="State / Province"
            value={subdivisionCode ?? ''}
            options={[{ value: '', label: '— Country default —' }, ...subdivisions.map((s) => ({ value: s.code, label: s.name }))]}
            onChange={(e) => setLocation(countryIso2, e.target.value || undefined)}
          />
        )}
        <div className="text-sm font-numeric tabular-nums">
          Tariff: <span className="font-semibold">{currency.symbol}{rate.toFixed(2)}/kWh</span>
          <span className="ml-2 text-xs text-gray-500">FX as of {snapshot.date} {isLive ? '(live)' : '(bundled)'}</span>
        </div>
        <div className="flex gap-2 items-center">
          <label htmlFor="manual-rate" className="text-sm">Override {currency.code}/kWh:</label>
          <input
            id="manual-rate"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={manualOverride ?? ''}
            placeholder={rate.toFixed(2)}
            onChange={(e) => {
              if (e.target.value === '') return setManualRate(null);
              const n = Number(e.target.value);
              setManualRate(Number.isFinite(n) ? Math.max(0, n) : null);
            }}
            className="min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 w-32 font-numeric tabular-nums"
          />
          <Button variant="secondary" onClick={detect} disabled={loading}>
            {loading ? 'Detecting…' : 'Detect from IP ↻'}
          </Button>
        </div>
        <div className="text-xs text-gray-500">Tariff data last updated {tariffsLastUpdated()}</div>
      </div>
    </Card>
  );
}