import { useEffect, useRef, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listComponents } from '@/lib/data/components';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { computeCost } from '@/lib/calc/cost';
import { resolveLocationTariff } from '@/lib/data/tariffs';
import { shareBuild } from '@/lib/share/buildLink';
import { ExportMenu } from './ExportMenu';
import { hasSelectedParts } from '@/lib/build/hasSelectedParts';

type ShareStatus = 'idle' | 'copied' | 'failed';

/** Compact results summary — the yearly answer, month/day figures, PSU sizing,
 *  share and export. Lives in the sticky sidebar; the chart and per-task tables
 *  are in `ResultsBreakdown`. */
export function ResultsPanel() {
  const setComponent = useBuildStore((s) => s.setComponent);
  const { build, daily, monthly, yearly, psuWattage, peakWallDrawW, recommendedPsuW, currency } = useCalc();
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const clearStatusTimer = useRef<number | null>(null);

  // The effective tariff the engine charges with: manual override, else the
  // bundled schedule including taxes at a typical 200 kWh month.
  const { rate: tariffRate, taxes } = resolveLocationTariff(
    build.location.country_iso2,
    build.location.subdivision_code,
  );
  const ratePerKwh = build.location.manual_rate_override ?? computeCost(200, tariffRate, taxes).total / 200;

  // Drop the "Link copied" confirmation after a few seconds, and never leave
  // the timer running past unmount.
  useEffect(
    () => () => {
      if (clearStatusTimer.current != null) window.clearTimeout(clearStatusTimer.current);
    },
    [],
  );

  const onShare = async () => {
    const result = await shareBuild(useBuildStore.getState().exportBuild());
    if (clearStatusTimer.current != null) {
      window.clearTimeout(clearStatusTimer.current);
      clearStatusTimer.current = null;
    }
    if (result === 'copied') {
      setShareStatus('copied');
      clearStatusTimer.current = window.setTimeout(() => setShareStatus('idle'), 3000);
    } else if (result === 'failed') {
      // Over the URL cap or no share/clipboard path — point at the export.
      setShareStatus('failed');
    } else {
      setShareStatus('idle');
    }
  };

  const shareMessage =
    shareStatus === 'copied'
      ? 'Link copied'
      : shareStatus === 'failed'
        ? 'Link too long — use Export instead'
        : '';

  /** Closest catalog PSU at or above the recommendation (Generic first). */
  const pickRecommendedPsu = () => {
    const psus = listComponents('psu').filter((p) => Number(p.specs.wattage_w) > 0);
    const byWatt = (p: (typeof psus)[number]) => Number(p.specs.wattage_w);
    const exact = psus.filter((p) => byWatt(p) === recommendedPsuW);
    const up = psus.filter((p) => byWatt(p) >= recommendedPsuW).sort((a, b) => byWatt(a) - byWatt(b));
    const pick =
      exact.find((p) => p.brand === 'Generic') ??
      exact[0] ??
      up.find((p) => p.brand === 'Generic') ??
      up[0] ??
      psus.sort((a, b) => byWatt(b) - byWatt(a))[0];
    if (pick) setComponent('psu', pick.id);
  };

  // No parts yet: the engine still derives a case-fan aggregate, so a ₹ figure
  // and a "4 W peak" would read as a confident wrong answer. Prompt instead.
  if (!hasSelectedParts(build)) {
    return (
      <Card className="p-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Yearly cost</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add a part and the yearly running cost appears here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Yearly cost</h2>
        <span className="text-xs text-gray-500 font-numeric tabular-nums">
          {currency.symbol}{ratePerKwh.toFixed(2)}/kWh
        </span>
      </div>

      <p className="mt-0.5 font-display text-3xl font-extrabold leading-none text-brand-text font-numeric tabular-nums">
        {formatCost(yearly.cost, currency)}
        <span className="ml-1.5 font-body text-sm font-normal text-gray-500">/ yr</span>
      </p>
      <p className="mt-1 text-sm text-gray-500 font-numeric tabular-nums">{formatKwh(yearly.kwh)}</p>

      {/* Month and day in one compact row — the yearly figure stays dominant. */}
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-numeric tabular-nums">
        <span className="text-gray-500">Monthly</span>
        <span className="font-semibold">{formatCost(monthly.cost, currency)}</span>
        <span aria-hidden className="text-gray-400">·</span>
        <span className="text-gray-500">Daily</span>
        <span className="font-semibold">{formatCost(daily.cost, currency)}</span>
      </p>

      {/* PSU sizing — one line; the sizing basis lives in the title. */}
      <div className="mt-2.5 border-t border-gray-200 pt-2 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">PSU {recommendedPsuW} W</span>
          <span
            className="text-xs text-gray-500 font-numeric tabular-nums"
            title="Peak draw at 100% load, plus a 35% safety margin on the recommendation"
          >
            peak {Math.round(peakWallDrawW)} W
          </span>
          {psuWattage != null && psuWattage >= recommendedPsuW && (
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
              ✓ your {psuWattage} W has headroom
            </span>
          )}
          {psuWattage != null && psuWattage < recommendedPsuW && (
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              ⚠ your {psuWattage} W is undersized
            </span>
          )}
          {psuWattage == null && <span className="text-xs text-gray-500">none selected</span>}
          {(psuWattage == null || psuWattage < recommendedPsuW) && (
            <Button
              size="sm"
              variant="secondary"
              onClick={pickRecommendedPsu}
              className="ml-auto shrink-0"
            >
              Pick one
            </Button>
          )}
        </div>
      </div>

      {/* Share + exports, one full-width row at the bottom. */}
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <Button size="sm" variant="primary" onClick={onShare} aria-label="Share build">
          Share
        </Button>
        <ExportMenu className="contents" />
      </div>
      {/* Status line lives outside the heading so the heading's accessible name
          stays stable; min-height reserves space (no layout shift). */}
      <p role="status" aria-live="polite" className="mt-1 text-xs text-gray-500 min-h-[1rem]">
        {shareMessage}
      </p>
    </Card>
  );
}
