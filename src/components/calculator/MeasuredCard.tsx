import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { Card } from '@/components/ui/Card';
import { psuEfficiency } from '@/lib/calc/psu';

/** −12% / +8% / "on the nose" */
function deltaLabel(measured: number, predicted: number): string {
  if (predicted <= 0) return '—';
  const pct = ((measured - predicted) / predicted) * 100;
  const rounded = Math.round(Math.abs(pct));
  if (rounded <= 5) return 'within 5%';
  return `${rounded}% ${pct > 0 ? 'higher' : 'lower'}`;
}

function Reading({
  id,
  label,
  hint,
  value,
  predicted,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number | null | undefined;
  predicted: number;
  onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={1}
          value={value ?? ''}
          placeholder={String(Math.round(predicted))}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onChange(raw === '' ? null : Number(raw));
          }}
          className="min-h-9 w-full rounded-8 border border-gray-300 bg-white pl-2 pr-7 font-numeric text-sm tabular-nums dark:border-gray-700 dark:bg-gray-900"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
          W
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-tight text-gray-500" title={hint}>
        {value != null && value > 0 ? deltaLabel(value, predicted) : `model ${Math.round(predicted)} W`}
      </p>
    </div>
  );
}

/**
 * "How accurate is this?" — the owner's own wall readings against the model.
 *
 * Everything here is a prediction built from rated TDPs and a PSU efficiency
 * curve; a smart-plug reading is ground truth. Showing the gap is more useful
 * than hiding it, and it is the only honest way to claim accuracy.
 */
export function MeasuredCard() {
  const { build, daily, idleDrawW, peakWallDrawW, psuRating, psuWattage, recommendedPsuW } = useCalc();
  const setMeasured = useBuildStore((s) => s.setMeasured);

  // Predicted wall figures for the three things a meter can actually measure.
  // Idle comes from the machine, not the schedule, so it reads the same even
  // when no idle hours are booked.
  const predictedIdle = idleDrawW;
  // The model average over a whole day, so it compares with "average W".
  const predictedAvg = daily.kwh > 0 ? (daily.kwh * 1000) / 24 : 0;

  const measured = build.measured ?? {};
  const loadPct = psuWattage ? (peakWallDrawW / psuWattage) * 100 : 50;
  const eff = psuEfficiency(psuRating ?? 'none', Math.min(100, Math.max(10, loadPct)));

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-bold">How accurate is this?</h2>
        <span className="text-xs text-gray-500">your meter</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        The estimate is a model of the machine. Enter a smart-plug reading (at the wall) to see how
        far off it is — hours you have not booked count as powered off.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Reading
          id="measured-idle"
          label="Idle"
          hint="Wall draw with the machine on but nothing running"
          value={measured.idle_w}
          predicted={predictedIdle}
          onChange={(v) => setMeasured({ idle_w: v })}
        />
        <Reading
          id="measured-load"
          label="Full load"
          hint="Wall draw during a sustained heavy workload or benchmark"
          value={measured.load_w}
          predicted={peakWallDrawW}
          onChange={(v) => setMeasured({ load_w: v })}
        />
        <Reading
          id="measured-avg"
          label="Average"
          hint="Wall draw averaged over a day, or over a metered week divided by the hours"
          value={measured.avg_w}
          predicted={predictedAvg}
          onChange={(v) => setMeasured({ avg_w: v })}
        />
      </div>

      {/* Where the loss between DC and AC comes from — the part most
          calculators skip, and the reason a "450 W" PSU is not 450 W at the wall. */}
      <p className="mt-3 border-t border-gray-100 pt-2 text-[11px] leading-relaxed text-gray-500 dark:border-gray-800">
        Component draw becomes wall draw through your PSU's 80 PLUS curve —{' '}
        <strong className="font-semibold text-gray-600 dark:text-gray-300">
          {Math.round(eff * 100)}% efficient
        </strong>{' '}
        at this load, so about {Math.round(peakWallDrawW * (1 - eff))} W of the peak is PSU loss
        rather than computing. A {recommendedPsuW} W unit is the safe size for this machine.
      </p>
    </Card>
  );
}
