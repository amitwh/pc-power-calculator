import { Link, useParams } from 'react-router-dom';
import type { TariffRate, TaxRule } from '@/types/tariff';
import { findCurrency } from '@/lib/data/currencies';
import {
  findTariff,
  listCountries,
  listSubdivisions,
  resolveLocationTariff,
  tariffNotes,
  tariffsLastUpdated,
} from '@/lib/data/tariffs';
import { computeCost } from '@/lib/calc/cost';
import { describeTariffRate, formatCost, formatKwh } from '@/lib/calc/format';
import { Card, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/analytics/adsense';

/** Worked-example systems, sized at the wall. */
const EXAMPLE_WATTS = [150, 350, 600] as const;
const EXAMPLE_HOURS_PER_DAY = 4;
const DAYS_PER_MONTH = 30.44;

function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** One row per slab, or a single row for a flat rate. */
function slabRows(rate: TariffRate): Array<{ label: string; rate: number }> {
  if (rate.flat != null) return [{ label: 'All units', rate: rate.flat }];

  // Slab caps are cumulative (100, then 300, then ∞), so every row after the
  // first is a BAND, not a ceiling — "up to 300" would imply all 300 units at
  // that rate, which is not how the bill is walked.
  const slabs = rate.slabs ?? [];
  return slabs.map((slab, i) => {
    const prevUpTo = slabs[i - 1]?.upTo_kwh ?? 0;
    if (slab.upTo_kwh == null) return { label: `Above ${prevUpTo} kWh/month`, rate: slab.rate };
    if (i === 0) return { label: `Up to ${slab.upTo_kwh} kWh/month`, rate: slab.rate };
    return { label: `${prevUpTo + 1}–${slab.upTo_kwh} kWh/month`, rate: slab.rate };
  });
}

/** Where a tax is charged: the energy subtotal or the running total. */
function taxBaseLabel(tax: TaxRule): string {
  return tax.appliesTo === 'energy' ? 'Energy charge' : 'Running total';
}

function TariffNotFound() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="Tariff not found" />
      <p className="text-sm">
        We don't have a bundled electricity tariff for that location.{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">
          Back to the calculator
        </Link>
        .
      </p>
    </div>
  );
}

export default function Cost() {
  const params = useParams();
  const iso2 = (params.country ?? '').toUpperCase();
  const subdivisionCode = params.state ? `${iso2}-${params.state.toUpperCase()}` : undefined;

  const country = listCountries().find((c) => c.iso2 === iso2);
  const subdivision = subdivisionCode
    ? listSubdivisions(iso2).find((s) => s.code === subdivisionCode)
    : undefined;
  // An unknown subdivision must not silently render the country default.
  const schedule = country && (!subdivisionCode || subdivision) ? findTariff(iso2, subdivisionCode) : undefined;

  if (!country || !schedule) return <TariffNotFound />;

  const place = subdivision ? `${subdivision.name}, ${country.name}` : country.name;
  const { rate, taxes } = resolveLocationTariff(iso2, subdivisionCode);
  const currency = findCurrency(rate.currency) ?? findCurrency('USD')!;
  const notes = tariffNotes(iso2, subdivisionCode);

  const examples = EXAMPLE_WATTS.map((watts) => {
    const kwh = (watts * EXAMPLE_HOURS_PER_DAY * DAYS_PER_MONTH) / 1000;
    const { total } = computeCost(kwh, rate, taxes);
    return { watts, kwh, total, effectivePerKwh: total / kwh };
  });
  const midRange = examples.find((e) => e.watts === 350)!;

  const taxSummary = taxes.length
    ? taxes.map((t) => `${t.name} at ${t.rate_pct}%`).join(' and ')
    : 'no separate tax line';

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the per-unit electricity rate in ${place}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${describeTariffRate(rate, currency)}. The bundled schedule applies ${taxSummary}.`,
        },
      },
      {
        '@type': 'Question',
        name: 'What does a 350 W PC cost per month at 4 hours a day?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `At 4 h/day a 350 W system uses about ${formatKwh(midRange.kwh)} a month, costing about ${formatCost(midRange.total, currency)} including slab rates and taxes — an effective ${formatCost(midRange.effectivePerKwh, currency)}/kWh.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Are taxes included in these costs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: taxes.length
            ? `Yes. The figures include ${taxSummary}. Energy-only taxes are charged on the energy subtotal; the rest are charged on the running total.`
            : 'No separate tax line is bundled for this schedule; the rates shown are treated as all-in. Check your own bill for local levies.',
        },
      },
    ],
  };

  const rows = slabRows(rate);

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 grid gap-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />

      <PageHeader
        title={`Electricity cost of running a PC in ${place}`}
        lede={`Bundled tariff snapshot · last updated ${tariffsLastUpdated()}`}
      />
      {notes && (
        <p className="border-l-2 border-amber-400 pl-3 text-xs text-gray-600 dark:text-gray-400">
          {notes}
        </p>
      )}

      <Card>
        <CardTitle>{rate.flat != null ? 'Flat rate' : 'Slab rates'}</CardTitle>
        <table className="w-full text-sm font-numeric tabular-nums">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <th className="py-1.5 pr-3 font-semibold">Monthly consumption</th>
              <th className="py-1.5 font-semibold">Rate ({currency.code}/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="py-1.5 pr-3">{row.label}</td>
                <td className="py-1.5">{formatCost(row.rate, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Applied taxes</CardTitle>
        {taxes.length > 0 ? (
          <table className="w-full text-sm font-numeric tabular-nums">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="py-1.5 pr-3 font-semibold">Tax</th>
                <th className="py-1.5 pr-3 font-semibold">Rate</th>
                <th className="py-1.5 font-semibold">Applied to</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((tax) => (
                <tr
                  key={tax.name}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="py-1.5 pr-3">{tax.name}</td>
                  <td className="py-1.5 pr-3">{tax.rate_pct}%</td>
                  <td className="py-1.5">{taxBaseLabel(tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm">
            No separate tax line is bundled for this schedule — the rates above are treated as
            all-in.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>What a PC costs here · 4 h/day example</CardTitle>
        <table className="w-full text-sm font-numeric tabular-nums">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <th className="py-1.5 pr-3 font-semibold">System at the wall</th>
              <th className="py-1.5 pr-3 font-semibold">Monthly energy</th>
              <th className="py-1.5 pr-3 font-semibold">Monthly cost</th>
              <th className="py-1.5 font-semibold">Effective rate</th>
            </tr>
          </thead>
          <tbody>
            {examples.map((example) => (
              <tr
                key={example.watts}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">
                  {example.watts} W PC
                </th>
                <td className="py-1.5 pr-3">{formatKwh(example.kwh)} / month</td>
                <td className="py-1.5 pr-3">{formatCost(example.total, currency)} / month</td>
                <td className="py-1.5">{formatCost(example.effectivePerKwh, currency)} / kWh</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">
          An illustrative 4 h/day, every day — not a promise.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Costs use the slab walk on monthly consumption: each unit is billed at the slab it falls
          in, then taxes are added. A PC's own consumption is a small slice of a household bill,
          and its slab position depends on the rest of the household's use.
        </p>
      </Card>

      {/* Below the worked examples: the reader already has their answer. */}
      <AdSlot slot={AD_SLOTS.tariffPage} />

      <Card>
        <Link to="/" className="text-brand-text underline underline-offset-2 font-medium">
          Open the calculator
        </Link>
        <span className="mx-2 text-gray-400">·</span>
        <Link to="/guides/india-tariff" className="text-brand-text underline underline-offset-2">
          Understanding your electricity bill in India
        </Link>
      </Card>
    </div>
  );
}
