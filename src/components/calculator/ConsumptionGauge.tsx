import {
  BatteryCharging,
  Bot,
  Car,
  Clapperboard,
  Cloud,
  Droplets,
  Factory,
  Flame,
  Fuel,
  Lightbulb,
  Refrigerator,
  Smartphone,
  Sun,
  TreePine,
  Database,
  FlaskConical,
  Gamepad2,
  Globe,
  HardDrive,
  Monitor,
  Ruler,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useCalc } from '@/hooks/useCalc';
import { hasSelectedParts } from '@/lib/build/hasSelectedParts';
import { CATEGORY_LABEL } from '@/lib/buildCategory';
import {
  CONSUMPTION_TIERS,
  suggestCategory,
  tierFor,
  tierPosition,
  typicalDrawW,
} from '@/lib/calc/classify';
import { equivalences } from '@/lib/calc/equivalences';
import { formatKwh } from '@/lib/calc/format';
import type { BuildCategory } from '@/types/build';

/** One glyph per equivalence, keyed by its stable id. */
const EQUIVALENCE_ICON: Record<string, LucideIcon> = {
  co2: Cloud,
  car: Car,
  tree: TreePine,
  coal: Factory,
  gas: Flame,
  diesel: Fuel,
  water: Droplets,
  ev: BatteryCharging,
  fridge: Refrigerator,
  led: Lightbulb,
  solar: Sun,
  phone: Smartphone,
};

const CATEGORY_ICON: Record<BuildCategory, LucideIcon> = {
  general: Monitor,
  gaming: Gamepad2,
  content: Clapperboard,
  workstation: Ruler,
  ai: Bot,
  homelab: FlaskConical,
  nas: HardDrive,
  web: Globe,
  database: Database,
};

/**
 * What the numbers mean in the world: which band the machine sits in, what it
 * looks like it is for, and a handful of unit conversions that make a yearly
 * kWh figure feel like something.
 *
 * Every equivalence states its arithmetic on hover; the card is a translation
 * of the bill, never a new claim about the hardware.
 */
export function ConsumptionGauge({ gridFactorKgPerKwh = 0.71 }: { gridFactorKgPerKwh?: number }) {
  const { build, rawComponents, yearly, upsEfficiency, peakWallDrawW } = useCalc();

  if (!hasSelectedParts(build)) return null;

  // Banded on the draw while it is on, not a 24/7 average.
  const avgW = typicalDrawW(yearly.kwh, build);
  const tier = tierFor(avgW);
  const suggestion = suggestCategory(build, rawComponents);
  const Icon = CATEGORY_ICON[suggestion.category];
  const co2 = yearly.kwh * gridFactorKgPerKwh;
  // The full set, grouped: what it took to make the electricity, what it costs
  // the environment, and what else it could have powered.
  const all = equivalences(yearly.kwh, co2);
  const pick = (group: string) => all.filter((e) => e.group === group).slice(0, 3);
  const facts = [...pick('carbon'), ...pick('fuel'), ...pick('water'), ...pick('everyday')].slice(0, 9);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold">What this means</h2>
        <span className="font-numeric text-xs tabular-nums text-gray-500">
          {formatKwh(yearly.kwh)} a year · {Math.round(avgW)} W while on
        </span>
      </div>

      {/* Which band the machine sits in. */}
      <div className="mt-3">
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          {CONSUMPTION_TIERS.map((t, i) => (
            <span
              key={t.key}
              className="absolute inset-y-0"
              style={{
                left: `${tierPosition(t.from)}%`,
                width: `${tierPosition(t.to ?? 1000) - tierPosition(t.from)}%`,
                background: `rgba(229,70,31,${0.08 + i * 0.13})`,
              }}
            />
          ))}
          <span
            className="absolute -top-1 h-4.5 w-1 rounded-full bg-brand-dark"
            style={{ left: `calc(${tierPosition(avgW)}% - 2px)` }}
            aria-hidden
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          <span>Barely on</span>
          <span>Heavy</span>
        </div>
        <p className="mt-2 text-sm">
          <span className="font-semibold text-gray-900 dark:text-gray-50">{tier.label}</span>
          <span className="text-gray-500"> — {tier.blurb}</span>
        </p>
      </div>

      {/* What it looks like it is for. */}
      <div className="mt-3 flex items-start gap-2 rounded-8 bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        <p className="text-sm">
          <span className="font-semibold text-gray-900 dark:text-gray-50">
            Looks like: {CATEGORY_LABEL[suggestion.category]}
          </span>
          <span className="text-gray-500"> — {suggestion.reason}</span>
        </p>
      </div>

      {/* Equivalences. */}
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {facts.map((f) => (
          <li
            key={f.label}
            className="rounded-8 border border-gray-100 px-2.5 py-2 dark:border-gray-800"
            title={f.basis}
          >
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {(() => {
                const Icon = EQUIVALENCE_ICON[f.key];
                return Icon ? (
                  <Icon className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
                ) : null;
              })()}
              <span className="truncate">{f.label}</span>
            </p>
            <p className="font-numeric text-lg font-bold tabular-nums text-gray-900 dark:text-gray-50">
              {f.value}
              <span className="ml-1 text-[11px] font-medium text-gray-500">{f.unit}</span>
            </p>
          </li>
        ))}
      </ul>

      {upsEfficiency < 1 && (
        <p className="mt-2 rounded-8 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          A UPS is in the power path. Its inverter adds about{' '}
          <strong className="font-semibold">
            {Math.round(peakWallDrawW * (1 - upsEfficiency))} W
          </strong>{' '}
          at peak — a second conversion stage after the PSU, not a load of its own.
        </p>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
        <Zap className="h-3 w-3" aria-hidden />
        Indicative conversions, not measurements. Hover a figure for the arithmetic; carbon uses{' '}
        {gridFactorKgPerKwh} kg CO₂/kWh.
      </p>
    </Card>
  );
}
