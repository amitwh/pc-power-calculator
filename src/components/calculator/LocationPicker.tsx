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
    <Card className="p-3">
      <CardTitle className="text-base">Location &amp; Tariff</CardTitle>
      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-2 [&_select]:!min-h-[36px] [&_select]:!text-sm">
          <Select
            aria-label="Country"
            value={countryIso2}
            options={countries.map((c) => ({ value: c.iso2, label: `${c.name} (${c.iso2})` }))}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Select
            aria-label="State / Province"
            value={subdivisionCode ?? ''}
            options={[
              { value: '', label: '— Country default —' },
              ...subdivisions.map((s) => ({ value: s.code, label: s.name })),
            ]}
            onChange={(e) => setLocation(countryIso2, e.target.value || undefined)}
            disabled={subdivisions.length === 0}
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="font-numeric tabular-nums">
            <span className="font-semibold">{currency.symbol}{rate.toFixed(2)}</span>/kWh
            <span className="ml-1.5 text-xs text-gray-500">
              {isManual ? 'manual' : tariffRate.slabs ? 'tiered, monthly' : 'bundled'} · FX {snapshot.date} {isLive ? '(live)' : ''}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <label htmlFor="manual-rate" className="text-xs text-gray-600 dark:text-gray-400">
              Override {currency.code}/kWh
            </label>
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
              className="w-20 min-h-[36px] px-2 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
            />
            <Button size="sm" variant="secondary" onClick={detect} disabled={loading} title="Detect location from IP">
              {loading ? '…' : 'Detect ↻'}
            </Button>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex-1 min-w-[200px] [&_select]:!min-h-[36px] [&_select]:!text-sm">
            <Select
              aria-label="Currency"
              value={currencyOverride}
              options={[
                { value: '', label: `Currency: Auto (${currency.code})` },
                ...listCurrencies().map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
              ]}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
          <span className="text-xs text-gray-500">
            {taxes.length > 0 && !isManual && `Incl. ${taxes.map((t) => `${t.name} ${t.rate_pct}%`).join(', ')}. `}
            Tariffs updated {tariffsLastUpdated()}
          </span>
        </div>
      </div>
    </Card>
  );
}
