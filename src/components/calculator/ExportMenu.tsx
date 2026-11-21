import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCalc } from '@/hooks/useCalc';
import { buildExportHtml, downloadExportHtml } from '@/lib/export';
import { exportPdf, type PdfReport, type PdfDeviceRow, type PdfScheduleRow } from '@/lib/export/pdf';
import { listCountries, listSubdivisions, resolveLocationTariff, tariffsLastUpdated, tariffProvenance } from '@/lib/data/tariffs';
import { workloadLabel } from '@/lib/data/workloads';
import { computeCost } from '@/lib/calc/cost';
import { findComponent } from '@/lib/data/components';
import { psuEfficiency } from '@/lib/calc/psu';
import { basisFor, certificationLabel } from '@/lib/export/pdf';
import { suggestCategory } from '@/lib/calc/classify';
import { CATEGORY_LABEL } from '@/lib/buildCategory';
import { getConsent } from '@/lib/analytics/consent';
import { event } from '@/lib/analytics/gtag';

/** "Kerala, India" from ISO codes (falls back to the bare codes). */
function locationLabel(countryIso2: string, subdivision?: string): string {
  const country = listCountries().find((c) => c.iso2 === countryIso2)?.name ?? countryIso2;
  if (!subdivision) return country;
  const sub = listSubdivisions(countryIso2).find((s) => s.code === subdivision)?.name ?? subdivision;
  return `${sub}, ${country}`;
}

export function ExportMenu({
  className = 'flex gap-1.5 flex-nowrap shrink-0',
}: {
  className?: string;
}) {
  // useCalc() already resolves the active build (multi-system store),
  // pre-computes daily / monthly / yearly totals, and resolves the display
  // currency (explicit override, else the build location's tariff currency).
  const { build, components, rawComponents, daily, monthly, yearly, peakWallDrawW, idleDrawW, recommendedPsuW, psuWattage, psuRating, totalEffectiveTdpW, currency } = useCalc();
  const [generating, setGenerating] = useState(false);

  // GA4 export tracking — gated by Consent Mode v2 so denied users keep full
  // export functionality and only opted-in users contribute to the event count.
  const trackExport = (format: 'pdf' | 'html') => {
    if (getConsent() === 'granted') event('export_format', { format });
  };

  const onPdf = async () => {
    setGenerating(true);
    try {
      // Distinct devices with unit counts (useCalc repeats each unit).
      const byId = new Map<string, PdfDeviceRow>();
      for (const c of components) {
        const row = byId.get(c.id) ?? {
          name: `${c.brand} ${c.model}`,
          category: c.category,
          qty: 0,
          unitW: c.effective_tdp_w,
          totalW: 0,
          basis: basisFor(findComponent(c.id)?.source),
          source: findComponent(c.id)?.source,
        };
        row.qty += 1;
        row.totalW = row.unitW != null ? row.unitW * row.qty : 0;
        byId.set(c.id, row);
      }

      const schedule: PdfScheduleRow[] = (yearly.perWorkload ?? []).map((r) => ({
        name: workloadLabel(r.workload_id),
        hoursPerDay: r.hours_per_day,
        daysPerWeek: build.schedule.find((s) => s.workload_id === r.workload_id)?.days_per_week ?? 7,
        drawW: r.draw_w,
        kwhYear: r.kwh,
        costYear: r.cost,
      }));

      const manualRate = build.location.manual_rate_override;
      const { rate, taxes } = resolveLocationTariff(
        build.location.country_iso2,
        build.location.subdivision_code,
      );
      const tariffLabel = manualRate != null
        ? `Manual override — ${manualRate.toFixed(2)} ${currency.code}/kWh`
        : `≈ ${(computeCost(200, rate, taxes).total / 200).toFixed(2)} ${currency.code}/kWh incl. ${taxes.map((t) => t.name).join(' + ') || 'no regional taxes'}`;

      const psuName =
        components.find((c) => c.category === 'psu')?.model ?? null;
      // Efficiency at the machine's own operating load, not a nominal 90%.
      const loadPct =
        psuWattage && psuWattage > 0 ? (totalEffectiveTdpW / psuWattage) * 100 : 50;
      const efficiencyAtLoad = psuRating
        ? psuEfficiency(psuRating, Math.min(100, Math.max(10, loadPct)))
        : null;

      const prov = tariffProvenance(build.location.country_iso2);
      const report: PdfReport = {
        buildName: build.name,
        buildCategory: build.category,
        locationLabel: locationLabel(build.location.country_iso2, build.location.subdivision_code),
        tariffLabel,
        currency,
        devices: [...byId.values()],
        typicalComponentW: totalEffectiveTdpW,
        idleWallW: idleDrawW,
        psu: {
          name: psuName,
          ratedW: psuWattage,
          certification: certificationLabel(psuRating),
          efficiencyAtLoad,
          recommendedW: recommendedPsuW,
          peakComponentW: totalEffectiveTdpW,
          peakWallW: peakWallDrawW,
        },
        measured: build.measured,
        suggestedCategory: (() => {
          const guess = suggestCategory(build, rawComponents);
          return { label: CATEGORY_LABEL[guess.category], reason: guess.reason };
        })(),
        tariffVerifiedAt: prov.updated ?? tariffsLastUpdated(),
        tariffSource: prov.source,
        tariffEstimated: prov.estimated,
        // The oldest catalogued part is the weakest link in the build's data.
        catalogVerifiedAt: [...byId.keys()]
          .map((id) => findComponent(id)?.addedAt)
          .filter((d): d is string => Boolean(d))
          .sort()[0],
        schedule,
        totals: {
          daily: { kwh: daily.kwh, cost: daily.cost },
          monthly: { kwh: monthly.kwh, cost: monthly.cost },
          yearly: { kwh: yearly.kwh, cost: yearly.cost },
        },
      };
      await exportPdf(report);
      trackExport('pdf');
    } finally {
      setGenerating(false);
    }
  };

  const onHtml = () => {
    const html = buildExportHtml(
      build,
      {
        daily:   { total: daily },
        monthly: { total: monthly },
        yearly:  { total: yearly },
      },
      currency,
    );
    downloadExportHtml(html, `pc-power-${new Date().toISOString().slice(0, 10)}.html`);
    trackExport('html');
  };

  return (
    <div className={className}>
      <Button
        size="sm"
        variant="ghost"
        onClick={onPdf}
        disabled={generating}
        aria-label="Export PDF"
        className="border border-gray-300 dark:border-gray-700"
      >
        {generating ? '…' : 'PDF'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onHtml}
        aria-label="Export HTML"
        className="border border-gray-300 dark:border-gray-700"
      >
        HTML
      </Button>
    </div>
  );
}
