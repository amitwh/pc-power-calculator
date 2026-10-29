import { Button } from '@/components/ui/Button';
import { useCalc } from '@/hooks/useCalc';
import { buildExportHtml, downloadExportHtml, exportPdf } from '@/lib/export';
import { getConsent } from '@/lib/analytics/consent';
import { event } from '@/lib/analytics/gtag';

export function ExportMenu() {
  // useCalc() already resolves the active build (multi-system store),
  // pre-computes daily / monthly / yearly totals, and resolves the display
  // currency (explicit override, else the build location's tariff currency).
  const { build, daily, monthly, yearly, currency } = useCalc();

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