import { useCalc } from '@/hooks/useCalc';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { computeCost } from '@/lib/calc/cost';
import { SMALLEST_STANDARD_PSU_W } from '@/lib/calc/psu';
import { resolveLocationTariff, listSubdivisions, listCountries } from '@/lib/data/tariffs';
import { hasSelectedParts } from '@/lib/build/hasSelectedParts';
import { usePickerStore } from '@/store/pickerStore';
import { ExportMenu } from './ExportMenu';
import { ShareMenu } from './ShareMenu';

/** "Ryzen 7 7800X3D · RTX 4070 SUPER · Maharashtra · 12 h/day in use" */
function summarise(parts: string[], place: string, hours: number): string {
  const bits = [...parts.slice(0, 2)];
  if (place) bits.push(place);
  if (hours > 0) bits.push(`${hours % 1 === 0 ? hours : hours.toFixed(1)} h/day in use`);
  return bits.join(' · ');
}

/**
 * "This machine needs a power supply" — the answer for a build that has no PSU.
 *
 * A recommendation, not a warning: the undersized-PSU warning below is a red
 * alarm about a unit you already picked, this one is about a unit you have
 * not picked yet, so it stays neutral and carries the brand colour on the
 * recommended wattage rather than on a red background.
 */
function PsuRecommendation({ peakW, recommendedW }: { peakW: number; recommendedW: number }) {
  const requestPicker = usePickerStore((s) => s.request);

  return (
    <div className="w-full rounded-8 border border-gray-200 bg-gray-100 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
      {/* The copy takes the row on a phone and the button sits beside it from
          `sm` up — side by side on a narrow screen the copy is squeezed into
          a two-word column. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-x-4">
        <p className="min-w-0 text-sm text-gray-700 dark:text-gray-300 sm:flex-1">
          <span className="font-semibold text-gray-900 dark:text-gray-50">Power supply</span> — no
          PSU in this build. Your parts draw{' '}
          <span className="font-semibold tabular-nums">{Math.round(peakW)} W</span> at full load,
          so a{' '}
          <span className="font-semibold tabular-nums text-brand-text dark:text-orange-300">
            {recommendedW} W
          </span>{' '}
          unit is the safe pick. 35% headroom covers transient spikes and keeps the supply on its
          efficiency sweet spot.
        </p>
        <button
          type="button"
          onClick={() => requestPicker('psu')}
          className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1 rounded-8 border border-gray-300 bg-white px-3 text-sm font-semibold text-brand-text hover:bg-gray-100 sm:w-auto dark:border-gray-700 dark:bg-gray-800 dark:text-orange-300 dark:hover:bg-gray-700"
        >
          Add a power supply
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

/**
 * The answer, first and biggest. This is the page's headline — everything else
 * on the screen exists to change these numbers.
 */
export function AnswerHero() {
  const { build, components, daily, monthly, yearly, psuWattage, peakWallDrawW, peakComponentDrawW, recommendedPsuW, currency } =
    useCalc();

  const countryIso2 = build.location.country_iso2;
  const subdivisionCode = build.location.subdivision_code;
  const { rate: tariffRate, taxes } = resolveLocationTariff(countryIso2, subdivisionCode);
  const ratePerKwh =
    build.location.manual_rate_override ?? computeCost(200, tariffRate, taxes).total / 200;

  const place =
    (subdivisionCode
      ? listSubdivisions(countryIso2).find((s) => s.code === subdivisionCode)?.name
      : undefined) ?? listCountries().find((c) => c.iso2 === countryIso2)?.name ?? '';

  // The two parts worth naming in the summary line — CPU and GPU if present.
  const named = ['cpu', 'gpu']
    .map((slot) => components.find((c) => c.category === slot))
    .filter(Boolean)
    .map((c) => c!.model);

  const bookedHours =
    build.schedule.reduce((acc, s) => acc + s.hours_per_day, 0)
    + (build.idle_hours_per_day ?? 0);

  if (!hasSelectedParts(build)) {
    return (
      <section className="border-b border-gray-200 pb-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.09em] text-gray-500">Your yearly cost</h2>
        <p className="mt-2 max-w-md text-sm text-gray-500">
          Add a part to your system and the running cost appears here — at{' '}
          {currency.symbol}
          {ratePerKwh.toFixed(2)} per kWh in {place || 'your area'}.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-wrap items-end gap-x-8 gap-y-5 border-b border-gray-200 pb-5">
      <div className="min-w-0">
        <h2 className="text-xs font-bold uppercase tracking-[0.09em] text-gray-500">Your yearly cost</h2>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
          <span
            title="Estimated annual running cost at this schedule and tariff"
            className="font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.035em] text-gray-950 tabular-nums sm:text-6xl md:text-7xl dark:text-gray-50"
          >
            {formatCost(yearly.cost, currency)}
          </span>
          <span className="text-lg font-semibold text-gray-400">/ year</span>
        </p>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {summarise(named, place, bookedHours)}
        </p>
      </div>

      <div className="ml-auto flex flex-wrap items-end gap-x-7 gap-y-3">
        <dl className="flex gap-6">
          {/* One hue per fact (see --color-fact-* in tokens.css) so the three
              figures read apart before the label does. */}
          {[
            {
              k: 'Per month',
              v: formatCost(monthly.cost, currency),
              tone: 'text-fact-month',
              title: 'Estimated monthly running cost at this schedule and tariff',
            },
            {
              k: 'Per day',
              v: formatCost(daily.cost, currency),
              tone: 'text-fact-day',
              title: 'Estimated daily running cost at this schedule and tariff',
            },
            {
              k: 'Energy',
              v: formatKwh(yearly.kwh, 0),
              tone: 'text-fact-energy',
              title: 'Estimated annual energy use at this schedule',
            },
          ].map((f) => (
            <div key={f.k} title={f.title}>
              <dt className="text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500">{f.k}</dt>
              <dd className={`mt-0.5 font-numeric text-[17px] font-bold tabular-nums ${f.tone}`}>
                {f.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <ShareMenu />
            <ExportMenu />
          </div>
        </div>
      </div>

      {/* PSU advice belongs with the answer, not buried in a settings card. */}
      {psuWattage != null && psuWattage < recommendedPsuW && (
        <p className="w-full text-sm font-semibold text-red-600 dark:text-red-400">
          ⚠ Your {psuWattage} W PSU is undersized for a 100% load of {Math.round(peakWallDrawW)} W —
          a {recommendedPsuW} W unit is the safe pick.
        </p>
      )}

      {/* No PSU at all: say what the machine needs, and make it one click to
          fix. The figure quoted is the PSU-side draw, so the 35% between it
          and the recommendation is the 35% the reader can check.

          The gate is the recommendation, not the number of parts: a build
          holding only a monitor and the two default case fans sizes to the
          smallest standard unit, and "a 300 W unit is the safe pick" for a 4 W
          machine reads as a bug. Once the recommendation clears the smallest
          unit there is something to say. */}
      {psuWattage == null && recommendedPsuW > SMALLEST_STANDARD_PSU_W && (
        <PsuRecommendation peakW={peakComponentDrawW} recommendedW={recommendedPsuW} />
      )}
    </section>
  );
}
