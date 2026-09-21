import { Button } from '@/components/ui/Button';
import { useCalc } from '@/hooks/useCalc';
import { buildExportHtml, downloadExportHtml, exportPdf } from '@/lib/export';
import type { CurrencyInfo } from '@/types/currency';

const INR: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 } as const;

export function ExportMenu() {
  // useCalc() already resolves the active build (multi-system store) and
  // pre-computes daily / monthly / yearly totals. We just wrap the flat
  // {kwh, cost} periods into the { total: {...} } shape buildExportHtml expects.
  const { build, daily, monthly, yearly } = useCalc();

  const onHtml = () => {
    const html = buildExportHtml(
      build,
      {
        daily:   { total: daily },
        monthly: { total: monthly },
        yearly:  { total: yearly },
      },
      INR,
    );
    downloadExportHtml(html, `pc-power-${new Date().toISOString().slice(0, 10)}.html`);
  };

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      <Button variant="primary" onClick={exportPdf}>Export PDF</Button>
      <Button variant="secondary" onClick={onHtml}>Export HTML</Button>
    </div>
  );
}