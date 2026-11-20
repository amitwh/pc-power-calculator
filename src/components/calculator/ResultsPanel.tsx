import { useEffect, useRef, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { listComponents } from '@/lib/data/components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { shareBuild } from '@/lib/share/buildLink';
import { ExportMenu } from './ExportMenu';

type ShareStatus = 'idle' | 'copied' | 'failed';

/** Compact results summary — period totals, PSU sizing, share, export. Lives in
 *  the sticky sidebar; the chart and per-task tables are in `ResultsBreakdown`. */
export function ResultsPanel() {
  const setComponent = useBuildStore((s) => s.setComponent);
  const { build, daily, monthly, yearly, psuWattage, peakWallDrawW, recommendedPsuW, currency } = useCalc();
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const clearStatusTimer = useRef<number | null>(null);

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

  return (
    <Card>
      <CardTitle className="text-base">
        <span className="truncate">Results — {build.name}</span>
        <span className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={onShare} aria-label="Share build">
            Share
          </Button>
          <ExportMenu />
        </span>
      </CardTitle>

      {/* Status line lives outside the heading so the heading's accessible name
          stays stable; min-height reserves space (no layout shift). */}
      <p
        role="status"
        aria-live="polite"
        className="text-xs text-gray-500 -mt-1 mb-2 min-h-[1rem]"
      >
        {shareMessage}
      </p>

      {/* Daily / Monthly / Yearly totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-numeric tabular-nums">
        {[
          { label: 'Daily',   kwh: daily.kwh,   cost: daily.cost,   sub: 'avg over 24 h schedule', primary: false },
          { label: 'Monthly', kwh: monthly.kwh, cost: monthly.cost, sub: '× 30.44 days',            primary: false },
          { label: 'Yearly',  kwh: yearly.kwh,  cost: yearly.cost,  sub: '× 365.25 days',           primary: true },
        ].map((row) => (
          <div
            key={row.label}
            className={`border rounded-8 p-3 ${
              row.primary
                ? 'bg-gradient-to-br from-brand to-brand-dark text-white border-transparent'
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className={`text-xs uppercase font-semibold ${row.primary ? 'text-white/85' : 'text-gray-500'}`}>
              {row.label}
            </div>
            <div className="font-display text-2xl font-bold mt-1">{formatKwh(row.kwh, 1)}</div>
            <div className={`font-semibold text-lg ${row.primary ? 'text-white' : 'text-brand-text'}`}>
              {formatCost(row.cost, currency)}
            </div>
            <div className={`text-xs mt-1 ${row.primary ? 'text-white/85' : 'text-gray-500'}`}>{row.sub}</div>
          </div>
        ))}
      </div>

      {/* PSU sizing guidance */}
      <div className="mt-5 border rounded-8 p-3 border-gray-200 dark:border-gray-800">
        <div className="text-xs uppercase text-gray-500 mb-2 font-semibold">PSU recommendation</div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-numeric tabular-nums text-sm">
          <span>
            Peak draw (all components at 100%):{' '}
            <strong className="font-display">{Math.round(peakWallDrawW)} W</strong>
          </span>
          <span>
            Recommended PSU: <strong className="font-display text-brand-text">{recommendedPsuW} W</strong>
          </span>
          {psuWattage != null && psuWattage >= recommendedPsuW && (
            <span className="text-green-700 dark:text-green-400 font-semibold">
              ✓ Your {psuWattage} W PSU has enough headroom
            </span>
          )}
          {psuWattage != null && psuWattage < recommendedPsuW && (
            <>
              <span className="text-red-600 dark:text-red-400 font-semibold">
                ⚠ Your {psuWattage} W PSU is undersized
              </span>
              <Button size="sm" variant="secondary" onClick={pickRecommendedPsu}>
                Pick a {recommendedPsuW} W PSU for me
              </Button>
            </>
          )}
          {psuWattage == null && (
            <>
              <span className="text-gray-500">No PSU selected (35% safety margin included)</span>
              <Button size="sm" variant="secondary" onClick={pickRecommendedPsu}>
                Pick a {recommendedPsuW} W PSU for me
              </Button>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Power-draw chart, per-task costs and the all-systems summary are below.
      </p>
    </Card>
  );
}
