import { useBuildStore } from '@/store/buildStore';
import { listCountries, listSubdivisions, resolveLocationTariff, currencyForLocation, tariffsLastUpdated } from '@/lib/data/tariffs';
import { listCurrencies } from '@/lib/data/currencies';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFx } from '@/hooks/useFx';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { computeCost } from '@/lib/calc/cost';

const fieldLabel = 'block text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1';

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
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className={fieldLabel}>Country</span>
          <Select
            aria-label="Country"
            className="!min-h-9 !text-sm"
            value={countryIso2}
            options={countries.map((c) => ({ value: c.iso2, label: `${c.name} (${c.iso2})` }))}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>State</span>
          <Select
            aria-label="State / Province"
            className="!min-h-9 !text-sm"
            value={subdivisionCode ?? ''}
            options={[
              { value: '', label: '— Country default —' },
              ...subdivisions.map((s) => ({ value: s.code, label: s.name })),
            ]}
            onChange={(e) => setLocation(countryIso2, e.target.value || undefined)}
            disabled={subdivisions.length === 0}
          />
        </label>
        <div>
          <label htmlFor="manual-rate" className={fieldLabel}>
            Rate
          </label>
          <div className="flex items-center gap-1.5">
            <span className="relative flex-1 min-w-0">
              <input
                id="manual-rate"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={manualOverride ?? ''}
                placeholder={rate.toFixed(2)}
                aria-label={`Rate — override ${currency.code}/kWh`}
                onChange={(e) => {
                  if (e.target.value === '') return setManualRate(null);
                  const n = Number(e.target.value);
                  setManualRate(Number.isFinite(n) ? Math.max(0, n) : null);
                }}
                className="w-full min-h-9 pl-2 pr-10 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 font-numeric tabular-nums text-sm"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                /kWh
              </span>
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={detect}
              disabled={loading}
              title="Detect location from IP"
              className="shrink-0"
            >
              {loading ? '…' : 'Detect ↻'}
            </Button>
          </div>
        </div>
        <label className="block">
          <span className={fieldLabel}>Currency</span>
          <Select
            aria-label="Currency"
            className="!min-h-9 !text-sm"
            value={currencyOverride}
            options={[
              { value: '', label: `Currency: Auto (${currency.code})` },
              ...listCurrencies().map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
            ]}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </label>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {isManual ? 'Manual rate' : tariffRate.slabs ? 'Tiered, billed monthly' : 'Bundled flat rate'}
        {' · '}FX {snapshot.date}
        {isLive ? ' (live)' : ''}
        {taxes.length > 0 && !isManual && (
          <> · Incl. {taxes.map((t) => `${t.name} ${t.rate_pct}%`).join(', ')}</>
        )}
        {' · '}Tariffs updated {tariffsLastUpdated()}
      </p>
    </Card>
  );
}
