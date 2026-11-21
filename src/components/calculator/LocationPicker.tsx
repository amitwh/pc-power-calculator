import { useBuildStore } from '@/store/buildStore';
import { listCountries, listSubdivisions, resolveLocationTariff, currencyForLocation, tariffsLastUpdated, tariffProvenance } from '@/lib/data/tariffs';
import { listCurrencies } from '@/lib/data/currencies';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFx } from '@/hooks/useFx';
import { Card } from '@/components/ui/Card';
import { HelpTip } from '@/components/ui/HelpTip';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { computeCost } from '@/lib/calc/cost';

const fieldLabel = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

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

  // Where the rate came from. An estimated figure carries a visible '*', so
  // the number is never presented as a verified tariff when it is not.
  const prov = tariffProvenance(countryIso2);

  const stateName = subdivisionCode
    ? subdivisions.find((s) => s.code === subdivisionCode)?.name
    : undefined;
  const countryName = countries.find((c) => c.iso2 === countryIso2)?.name ?? countryIso2;

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1">
          <h2 className="font-display text-base font-bold">Your tariff</h2>
          <HelpTip
            align="left"
            label="About the tariff"
            text="Resolved from your location and tariff data; override the rate if your bill differs."
          />
        </span>
        <span className="text-xs text-gray-500">
          {isManual ? 'manual' : tariffRate.slabs ? 'tiered' : 'flat'}
        </span>
      </div>

      {/* The rate is the number that drives everything, so it gets the display
          face and the space; the controls live behind the disclosure. */}
      <p
        className="mt-3 flex items-baseline gap-1.5"
        title="Effective rate used by the calculation, including taxes at a typical 200 kWh month"
      >
        <span className="font-display text-4xl font-extrabold leading-none tracking-[-0.02em] tabular-nums text-gray-950 dark:text-gray-50">
          {currency.symbol}
          {rate.toFixed(2)}
          {prov.estimated && <sup className="ml-0.5 text-base font-bold text-brand-text">*</sup>}
        </span>
        <span className="text-sm font-semibold text-gray-500">/ kWh</span>
      </p>

      <p className="mt-2 text-sm text-gray-900 dark:text-gray-50">
        {stateName ? `${stateName}, ${countryName}` : countryName}
      </p>
      <p className="mt-0.5 text-xs text-gray-500" title={`FX ${snapshot.date} · tariffs updated ${tariffsLastUpdated()}`}>
        {isManual
          ? 'Manual rate, tax-free'
          : taxes.length > 0
            ? `Includes ${taxes.map((t) => `${t.name} ${t.rate_pct}%`).join(', ')}`
            : 'Bundled flat rate'}
        {isLive ? ' · live FX' : ''}
      </p>
      {(prov.source || prov.updated) && (
        <p className="mt-1 text-[11px] leading-tight text-gray-500">
          {prov.estimated ? '* Estimated rate. ' : ''}
          {prov.source}
          {prov.updated ? ` · updated ${prov.updated}` : ''}
        </p>
      )}

      <details className="mt-3">
        <summary
          title="Change the country, state or the rate used"
          className="cursor-pointer select-none rounded-8 border border-dashed border-gray-300 px-2.5 py-1.5 text-center text-sm font-semibold text-gray-600 hover:border-brand hover:text-brand-text dark:border-gray-600 dark:text-gray-300"
        >
          Change location or rate
        </summary>

        <div className="mt-2 space-y-2">
          <label className="block">
            <span className={fieldLabel}>Country</span>
            <Select
              aria-label="Country"
              className="!min-h-9 !text-sm"
              value={countryIso2}
              options={countries.map((c) => ({ value: c.iso2, label: `${c.name} (${c.iso2})` }))}
              onChange={(e) => {
              setLocation(e.target.value);
              // Moving country must not leave an explicit currency behind: an
              // override set for the old country would silently pin the symbol
              // (and the figure) to the old currency for every country after it.
              if (currencyOverride) setCurrency('');
            }}
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
              Rate override
            </label>
            <div className="flex items-center gap-1.5">
              <span className="relative min-w-0 flex-1">
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
                  className="min-h-9 w-full rounded-8 border border-gray-300 bg-white pl-2 pr-10 font-numeric text-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
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
                {loading ? '…' : 'Detect'}
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
                { value: '', label: `Auto (${currency.code})` },
                ...listCurrencies().map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
              ]}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </label>
          <p className="text-[11px] leading-tight text-gray-500">
            FX {snapshot.date} · tariffs updated {tariffsLastUpdated()}
          </p>
        </div>
      </details>
    </Card>
  );
}
