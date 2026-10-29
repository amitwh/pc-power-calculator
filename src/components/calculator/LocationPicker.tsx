import { useBuildStore } from '@/store/buildStore';
import { listCountries, listSubdivisions, resolveLocationTariff, currencyForLocation, tariffsLastUpdated } from '@/lib/data/tariffs';
import { listCurrencies } from '@/lib/data/currencies';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFx } from '@/hooks/useFx';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { computeCost } from '@/lib/calc/cost';

export function LocationPicker() {
  const { loading, detect } = useGeolocation();
  const { snapshot, isLive } = useFx();
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const build = builds.find((b) => b.id === activeBuildId);
  const setLocation = useBuildStore((s) => s.setLocation);
  const setManualRate = useBuildStore((s) => s.setManualRate);
  const setCurrency = useBuildStore((s) => s.setCurrency);

  const countries = listCountries();
  const countryIso2 = build?.location.country_iso2 ?? 'IN';
  const subdivisionCode = build?.location.subdivision_code;
  const subdivisions = listSubdivisions(countryIso2);
  const manualOverride = build?.location.manual_rate_override;
  const currencyOverride = build?.currency_override ?? '';

  // Currency: explicit override, else the tariff currency of this location
  // (₹ for India, $ for US, …) — matches what the calc engine charges with.
  const currency = currencyForLocation(countryIso2, subdivisionCode, currencyOverride);
  const { rate: tariffRate, taxes } = resolveLocationTariff(countryIso2, subdivisionCode);
  // Display the effective rate INCLUDING taxes at a typical 200 kWh month —
  // the same basis the engine charges with (manual overrides are tax-free).
  const rate = manualOverride ?? computeCost(200, tariffRate, taxes).total / 200;
  const isManual = manualOverride != null;

  return (
    <Card>
      <CardTitle>2. Location &amp; Tariff</CardTitle>
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
          <span className="ml-2 text-xs text-gray-500">
            {isManual ? 'manual override' : tariffRate.slabs ? 'tiered slabs, billed monthly' : 'bundled rate'} · FX as of {snapshot.date} {isLive ? '(live)' : '(bundled)'}
          </span>
        </div>
        {taxes.length > 0 && !isManual && (
          <div className="text-xs text-gray-500">
            Includes {taxes.map((t) => `${t.name} ${t.rate_pct}%`).join(', ')}
          </div>
        )}
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
        <Select
          aria-label="Currency"
          value={currencyOverride}
          options={[
            { value: '', label: `Auto (${currency.code} — from location)` },
            ...listCurrencies().map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
          ]}
          onChange={(e) => setCurrency(e.target.value)}
        />
        <div className="text-xs text-gray-500">Tariff data last updated {tariffsLastUpdated()}</div>
      </div>
    </Card>
  );
}