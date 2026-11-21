import { useEffect, useRef, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { buildPermalinkUrl } from '@/lib/share/buildLink';
import { workloadLabel } from '@/lib/data/workloads';
import { listCountries, listSubdivisions } from '@/lib/data/tariffs';
import { formatCost, formatKwh } from '@/lib/calc/format';

/**
 * One place to get a build out of the page: a permanent `/build/<token>` link,
 * a plain-text configuration to paste into a forum, WhatsApp / Reddit, or a
 * duplicate to tinker with.
 *
 * The permalink is computed in an effect, not during render: it depends on
 * `window.location.origin`, and server-rendered markup must not disagree with
 * the first client render.
 */
export function ShareMenu() {
  const { build, components, yearly, monthly, currency, peakWallDrawW, recommendedPsuW } = useCalc();
  const duplicateActiveBuild = useBuildStore((s) => s.duplicateActiveBuild);
  const [permalink, setPermalink] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const timer = useRef<number | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const json = useBuildStore.getState().exportBuild();
    setPermalink(buildPermalinkUrl(json));
  }, [build]);

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  const flash = (message: string) => {
    setStatus(message);
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), 3000);
  };

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(message);
    } catch {
      flash('Clipboard blocked — select the link and copy it');
    }
  };

  /** A configuration as plain text: what goes in a forum post. */
  const configurationText = () => {
    const place = [
      build.location.subdivision_code
        ? listSubdivisions(build.location.country_iso2).find(
            (s) => s.code === build.location.subdivision_code,
          )?.name
        : undefined,
      listCountries().find((c) => c.iso2 === build.location.country_iso2)?.name,
    ]
      .filter(Boolean)
      .join(', ');

    const units = new Map<string, number>();
    for (const c of components) units.set(c.id, (units.get(c.id) ?? 0) + 1);

    const parts = [...units.entries()].map(([id, qty]) => {
      const c = components.find((x) => x.id === id)!;
      return `- ${c.brand} ${c.model}${qty > 1 ? ` ×${qty}` : ''}`;
    });

    const usage = build.schedule
      .filter((s) => s.hours_per_day > 0)
      .map((s) => `${workloadLabel(s.workload_id as never)} ${s.hours_per_day} h/day`);

    return [
      `${build.name} — PC Power Calculator`,
      ...parts,
      '',
      `Usage: ${[...usage, build.idle_hours_per_day ? `idle ${build.idle_hours_per_day} h/day` : ''].filter(Boolean).join(' · ') || '—'}`,
      `Peak draw ${Math.round(peakWallDrawW)} W at the wall · PSU ${recommendedPsuW} W recommended`,
      `${formatCost(yearly.cost, currency)}/year · ${formatKwh(yearly.kwh, 0)} · ${formatCost(monthly.cost, currency)}/month${place ? ` · ${place}` : ''}`,
      permalink ?? '',
    ]
      .filter((line) => line !== '')
      .join('\n');
  };

  const close = () => detailsRef.current?.removeAttribute('open');

  return (
    <details ref={detailsRef} className="relative">
      <summary
        aria-label="Share build"
        title="Get a permalink, copy the configuration or share this estimate"
        className="inline-flex min-h-[38px] cursor-pointer list-none items-center rounded-8 bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark [&::-webkit-details-marker]:hidden"
      >
        Share this estimate
      </summary>

      <div className="absolute right-0 z-40 mt-1 w-64 rounded-12 border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-gray-900">
        {permalink ? (
          <input
            readOnly
            aria-label="Share link"
            value={permalink}
            onFocus={(e) => e.target.select()}
            className="mb-1 w-full rounded-8 border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          />
        ) : (
          <p className="mb-1 rounded-8 bg-gray-50 px-2 py-1.5 text-[11px] text-gray-500 dark:bg-gray-800">
            This build is too large to fit in a URL — use the PDF export instead.
          </p>
        )}

        <button
          type="button"
          disabled={!permalink}
          onClick={() => permalink && copy(permalink, 'Link copied')}
          title="Copy the permanent link to this build"
          className="flex w-full items-center gap-2 rounded-8 px-2 py-1.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          🔗 Copy permanent link
        </button>
        <button
          type="button"
          onClick={() => copy(configurationText(), 'Configuration copied')}
          title="Copy the parts, schedule and tariff as plain text"
          className="flex w-full items-center gap-2 rounded-8 px-2 py-1.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          📋 Copy configuration
        </button>

        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

        {permalink && (
          <>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${build.name} — ${formatCost(yearly.cost, currency)}/year to run\n${permalink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex w-full items-center gap-2 rounded-8 px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              💬 Share on WhatsApp
            </a>
            <a
              href={`https://www.reddit.com/submit?url=${encodeURIComponent(permalink)}&title=${encodeURIComponent(`${build.name}: ${formatCost(yearly.cost, currency)}/year to run`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex w-full items-center gap-2 rounded-8 px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              👽 Share on Reddit
            </a>
          </>
        )}

        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

        <a
          href="/compare"
          onClick={close}
          className="flex w-full items-center gap-2 rounded-8 px-2 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          ⚖️ Compare with another build
        </a>
        <button
          type="button"
          onClick={() => {
            duplicateActiveBuild();
            close();
            flash('Duplicated — you are now editing the copy');
          }}
          className="flex w-full items-center gap-2 rounded-8 px-2 py-1.5 text-left text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          ⧉ Duplicate this build
        </button>

        <p role="status" aria-live="polite" className="min-h-[1rem] px-2 text-[11px] text-gray-500">
          {status}
        </p>
      </div>
    </details>
  );
}
