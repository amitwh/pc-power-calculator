import { Link, useParams } from 'react-router-dom';
import type { BuildComponents, BuildConfig } from '@/types/build';
import type { Component, ComponentCategory } from '@/types/component';
import type { WorkloadId } from '@/types/workload';
import { findComponent, listComponents } from '@/lib/data/components';
import { confidenceFor, CONFIDENCE_CLASS } from '@/lib/data/confidence';
import { listWorkloads } from '@/lib/data/workloads';
import { findCurrency } from '@/lib/data/currencies';
import { computeEnergy } from '@/lib/calc/energy';
import { componentPowerW } from '@/lib/calc/power';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { Card, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { AdSlot } from '@/components/ads/AdSlot';
import { AD_SLOTS } from '@/lib/analytics/adsense';

/** Catalog category → the build slot that holds one part of that category. */
const SLOT_FOR_CATEGORY: Partial<Record<ComponentCategory, keyof BuildComponents>> = {
  cpu: 'cpu',
  gpu: 'gpu',
  ram: 'ram',
  storage: 'storage',
  motherboard: 'motherboard',
  psu: 'psu',
  cooler: 'cooler',
  monitor: 'monitors',
  add_in_card: 'add_in_cards',
  optical_drive: 'optical_drives',
  ups: 'ups',
  peripheral: 'peripherals',
  fan: 'fans',
};

/** Slots that hold an array of ids rather than a single id. */
const ARRAY_SLOTS = new Set<keyof BuildComponents>([
  'ram',
  'storage',
  'monitors',
  'add_in_cards',
  'optical_drives',
  'peripherals',
  'fans',
]);

/** A one-part build so the engine reports only this part's share. */
function onePartComponents(part: Component): BuildComponents | null {
  const slot = SLOT_FOR_CATEGORY[part.category];
  if (!slot) return null;
  return ({ [slot]: ARRAY_SLOTS.has(slot) ? [part.id] : part.id } as BuildComponents);
}

/** Workload used for the "at load" scenario, chosen by part type. */
function loadWorkload(part: Component): WorkloadId {
  if (part.category === 'gpu') return 'gaming_1440p';
  if (part.category === 'cpu') return 'compile';
  return 'office';
}

/** `vram_gb` → "Vram gb". */
function humaniseKey(key: string): string {
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatSpecValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function PartNotFound() {
  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <PageHeader title="Part not found" />
      <p className="text-sm">
        We couldn't find that part in the catalog.{' '}
        <Link to="/" className="text-brand-text underline underline-offset-2">
          Back to the calculator
        </Link>
        .
      </p>
    </div>
  );
}

export default function Part() {
  const params = useParams();
  const part = params.id ? findComponent(params.id) : undefined;

  if (!part) return <PartNotFound />;

  const name = `${part.brand} ${part.model}`;
  const ratedTdp = part.tdp_w;
  const conf = confidenceFor(part.source);
  const confidence = { ...conf, className: CONFIDENCE_CLASS[conf.level] };
  const inr = findCurrency('INR')!;
  const workloads = listWorkloads();
  const components = onePartComponents(part);

  const idleW = componentPowerW(part, 0);
  const loadW = componentPowerW(part, 1);
  const idleText = `${idleW.toFixed(1)} W`;
  const loadText = `${loadW.toFixed(1)} W`;

  const patterns: Array<{ label: string; workload: WorkloadId; hours: number }> = [
    { label: '4 h/day at load', workload: loadWorkload(part), hours: 4 },
    { label: '8 h/day mixed use', workload: 'office', hours: 8 },
    { label: '24/7 idle', workload: 'server_idle', hours: 24 },
  ];
  const scenarios = components
    ? patterns.map(({ label, workload, hours }) => {
        const build: BuildConfig = {
          id: 'part-page',
          name: 'Part page',
          components,
          tdpOverrides: {},
          schedule: [{ workload_id: workload, hours_per_day: hours }],
          location: { country_iso2: 'IN' },
        };
        const { total } = computeEnergy(build, workloads, 'year');
        return { label, kwh: total.kwh, cost: total.cost };
      })
    : [];

  const specs = part.specs
    ? Object.entries(part.specs).filter(([, value]) => value !== '' && value != null)
    : [];

  // "Lower-power" must still mean "a plausible alternative": within 35–100% of
  // this part's TDP and within six model years. Without those bounds a 2022
  // card gets offered 2005-era integrated graphics as alternatives.
  const lowerPower =
    ratedTdp == null
      ? []
      : listComponents(part.category)
          .filter(
            (c) =>
              c.tdp_w != null &&
              c.tdp_w < ratedTdp &&
              c.tdp_w >= ratedTdp * 0.35 &&
              Math.abs(c.releaseYear - part.releaseYear) <= 6,
          )
          .sort((a, b) => (b.tdp_w as number) - (a.tdp_w as number))
          .slice(0, 5);

  const categoryLabel = part.category === 'gpu' ? 'Graphics card' : part.category === 'cpu' ? 'Processor' : 'Component';

  const firstScenario = scenarios.find((s) => s.label === '4 h/day at load');
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How much power does the ${name} use?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text:
            ratedTdp == null
              ? `The catalog does not list a rated TDP for the ${name}. The calculator models ${loadText} at full load — component draw, before PSU efficiency.`
              : `The ${name} has a rated TDP of ${ratedTdp} W. The calculator models ${loadText} at full load — component draw, before PSU efficiency.`,
        },
      },
      {
        '@type': 'Question',
        name: `What does running the ${name} cost per year in India?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: firstScenario
            ? `Run alone at 4 h/day at load, the ${name} uses ${formatKwh(firstScenario.kwh)} a year — about ${formatCost(firstScenario.cost, inr)} on an Indian tariff. This is this part's share only.`
            : `See the calculator for the ${name}'s yearly running cost on an Indian tariff.`,
        },
      },
      {
        '@type': 'Question',
        name: `How much does the ${name} draw at idle?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The calculator models the ${name} at ${idleText} when idle.`,
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8 grid gap-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(faq) }} />

      <PageHeader title={name} lede={`${categoryLabel} · released ${part.releaseYear}`} />

      <Card>
        <CardTitle>Key power figures</CardTitle>
        <dl className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase text-gray-500">Rated TDP</dt>
            <dd className="font-numeric tabular-nums text-lg font-semibold">
              {ratedTdp == null ? '—' : `${ratedTdp} W`}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Modelled idle</dt>
            <dd className="font-numeric tabular-nums text-lg font-semibold">{idleText}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-gray-500">Modelled full load</dt>
            <dd className="font-numeric tabular-nums text-lg font-semibold">{loadText}</dd>
          </div>
        </dl>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${confidence.className}`}>
            {confidence.label}
          </span>
          <span>
            Rated TDP from <strong className="font-semibold text-gray-600 dark:text-gray-300">{part.source}</strong>
            {part.addedAt ? ` · catalogued ${part.addedAt}` : ''}. Modelled figures come from the
            calculator's power model, not a measurement.
          </span>
        </p>
      </Card>

      {scenarios.length > 0 && (
        <Card>
          <CardTitle>Cost to run this part alone</CardTitle>
          <table className="w-full text-sm font-numeric tabular-nums">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                <th className="py-1.5 pr-3 font-semibold">Usage pattern</th>
                <th className="py-1.5 pr-3 font-semibold">Yearly energy</th>
                <th className="py-1.5 font-semibold">Yearly cost</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.label} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="py-1.5 pr-3">{s.label}</td>
                  <td className="py-1.5 pr-3">{formatKwh(s.kwh)} / year</td>
                  <td className="py-1.5">{formatCost(s.cost, inr)} / year</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-gray-500">
            This part's share only — it excludes the rest of the system, the PSU's efficiency loss and
            monitors. Costs use India's bundled domestic tariff; pick another country in the
            calculator.
          </p>
        </Card>
      )}

      {/* Below the cost table: the reader already has their answer. */}
      <AdSlot slot={AD_SLOTS.partPage} />

      {specs.length > 0 && (
        <Card>
          <CardTitle>Specifications</CardTitle>
          <table className="w-full text-sm">
            <tbody>
              {specs.map(([key, value]) => (
                <tr key={key} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <th scope="row" className="py-1.5 pr-3 text-left font-medium text-gray-600 dark:text-gray-400">
                    {humaniseKey(key)}
                  </th>
                  <td className="py-1.5 font-numeric tabular-nums">{formatSpecValue(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {lowerPower.length > 0 && (
        <Card>
          <CardTitle>Lower-power parts in the same category</CardTitle>
          <ul className="text-sm list-disc pl-5 space-y-1">
            {lowerPower.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/parts/${encodeURIComponent(c.id)}`}
                  className="text-brand-text underline underline-offset-2"
                >
                  {c.brand} {c.model}
                </Link>{' '}
                — {c.tdp_w} W
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500">
            Not a performance comparison — check benchmarks before choosing.
          </p>
        </Card>
      )}

      <Card>
        <Link
          to={`/?part=${encodeURIComponent(part.id)}`}
          className="text-brand-text underline underline-offset-2 font-medium"
        >
          Open this part in the calculator
        </Link>
        <span className="mx-2 text-gray-400">·</span>
        <Link to="/guides" className="text-brand-text underline underline-offset-2">
          Guides &amp; explainers
        </Link>
      </Card>
    </div>
  );
}
