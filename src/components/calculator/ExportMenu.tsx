import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCalc } from '@/hooks/useCalc';
import { buildExportHtml, downloadExportHtml } from '@/lib/export';
import { exportPdf, type PdfReport, type PdfDeviceRow, type PdfScheduleRow } from '@/lib/export/pdf';
import { listCountries, listSubdivisions, resolveLocationTariff } from '@/lib/data/tariffs';
import { listWorkloads } from '@/lib/data/workloads';
import { computeCost } from '@/lib/calc/cost';
import { getConsent } from '@/lib/analytics/consent';
import { event } from '@/lib/analytics/gtag';

/** "Kerala, India" from ISO codes (falls back to the bare codes). */
function locationLabel(countryIso2: string, subdivision?: string): string {
  const country = listCountries().find((c) => c.iso2 === countryIso2)?.name ?? countryIso2;
  if (!subdivision) return country;
  const sub = listSubdivisions(countryIso2).find((s) => s.code === subdivision)?.name ?? subdivision;
  return `${sub}, ${country}`;
}

export function ExportMenu() {
  // useCalc() already resolves the active build (multi-system store),
  // pre-computes daily / monthly / yearly totals, and resolves the display
  // currency (explicit override, else the build location's tariff currency).
  const { build, components, daily, monthly, yearly, peakWallDrawW, recommendedPsuW, psuWattage, currency } = useCalc();
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
        };
        row.qty += 1;
        row.totalW = row.unitW != null ? row.unitW * row.qty : 0;
        byId.set(c.id, row);
      }

      const workloadNames = new Map(listWorkloads().map((w) => [w.id, w.name]));
      const schedule: PdfScheduleRow[] = (yearly.perWorkload ?? []).map((r) => ({
        name: workloadNames.get(r.workload_id) ?? r.workload_id,
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

      const report: PdfReport = {
        buildName: build.name,
        buildCategory: build.category,
        locationLabel: locationLabel(build.location.country_iso2, build.location.subdivision_code),
        tariffLabel,
        currency,
        devices: [...byId.values()],
        peakWallDrawW,
        recommendedPsuW,
        installedPsuW: psuWattage,
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
    <div className="flex gap-1.5 flex-nowrap shrink-0">
      <Button size="sm" variant="primary" onClick={onPdf} disabled={generating} aria-label="Export PDF">
        {generating ? '…' : 'PDF'}
      </Button>
      <Button size="sm" variant="secondary" onClick={onHtml} aria-label="Export HTML">HTML</Button>
    </div>
  );
}
