import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';
import { formatCost, formatKwh } from '@/lib/calc/format';

export function buildExportHtml(
  build: BuildConfig,
  results: { daily: { total: { kwh: number; cost: number } }; monthly: { total: { kwh: number; cost: number } }; yearly: { total: { kwh: number; cost: number } } },
  currency: CurrencyInfo,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const json = JSON.stringify({ version: 1, build });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${build.name} — PC Power Calculator</title>
<style>
  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 1rem; color: #111; }
  h1 { color: #e5461f; font-family: Inter, sans-serif; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-variant-numeric: tabular-nums; }
  th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
  th { background: #fafbfc; }
  .reimport { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #e5461f; color: white; text-decoration: none; border-radius: 8px; }
</style>
</head>
<body>
<h1>${build.name}</h1>
<p>Generated ${date} · pcpower.concreteinfo.co.in</p>
<table>
  <thead><tr><th>Period</th><th>Energy</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Daily</td><td>${formatKwh(results.daily.total.kwh)}</td><td>${formatCost(results.daily.total.cost, currency)}</td></tr>
    <tr><td>Monthly</td><td>${formatKwh(results.monthly.total.kwh)}</td><td>${formatCost(results.monthly.total.cost, currency)}</td></tr>
    <tr><td>Yearly</td><td>${formatKwh(results.yearly.total.kwh)}</td><td>${formatCost(results.yearly.total.cost, currency)}</td></tr>
  </tbody>
</table>
<a class="reimport" href="https://pcpower.concreteinfo.co.in/#/compare?builds=${encodeURIComponent(btoa(json))}">Open in PC Power Calculator</a>
<script type="application/json" id="build-config">${json.replace(/</g, '\\u003c')}</script>
</body>
</html>`;
}

export function downloadExportHtml(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}