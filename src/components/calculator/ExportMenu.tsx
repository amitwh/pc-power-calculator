import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { useCalc } from '@/hooks/useCalc';
import { findCurrency } from '@/lib/data/currencies';
import { buildExportHtml, downloadExportHtml, exportPdf } from '@/lib/export';
import { useBuildStore } from '@/store/buildStore';
import { getConsent } from '@/lib/analytics/consent';
import { event } from '@/lib/analytics/gtag';
import type { CurrencyInfo } from '@/types/currency';

const DEFAULT_INR: CurrencyInfo = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  decimalDigits: 2,
} as const;

export function ExportMenu() {
  // useCalc() already resolves the active build (multi-system store) and
  // pre-computes daily / monthly / yearly totals. We just wrap the flat
  // {kwh, cost} periods into the { total: {...} } shape buildExportHtml expects.
  const { build, daily, monthly, yearly } = useCalc();

  // Currency follows the active build's override; falls back to INR.
  // Mirrors the same pattern in src/pages/Compare.tsx so a US/EU user
  // sees their own currency in the exported HTML (not a stray ₹).
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const currency: CurrencyInfo = useMemo(
    () =>
      findCurrency(
        builds.find((b) => b.id === activeBuildId)?.currency_override ?? '',
      ) ?? DEFAULT_INR,
    [builds, activeBuildId],
  );

  // GA4 export tracking — gated by Consent Mode v2 so denied users keep full
  // export functionality and only opted-in users contribute to the event count.
  const trackExport = (format: 'pdf' | 'html') => {
    if (getConsent() === 'granted') event('export_format', { format });
  };

  const onPdf = () => { exportPdf(); trackExport('pdf'); };
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
    <div className="flex gap-2 mt-3 flex-wrap">
      <Button variant="primary" onClick={onPdf}>Export PDF</Button>
      <Button variant="secondary" onClick={onHtml}>Export HTML</Button>
    </div>
  );
}