import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';
import { formatCost, formatKwh } from '@/lib/calc/format';

/**
 * Escape characters that have special meaning in HTML so user-supplied
 * strings can be safely interpolated into an HTML document without
 * enabling script injection (XSS) when the file is opened.
 */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default:  return c;
    }
  });
}

/**
 * Escape characters inside an inline `<script>` body that could either close
 * the script element prematurely (`</script>`) or break a JavaScript string
 * literal (U+2028 LINE SEPARATOR, U+2029 PARAGRAPH SEPARATOR are valid in
 * JS source but treated as line terminators in some contexts).
 *
 * `<`, `>`, and `&` are also escaped to keep the JSON payload well-formed
 * when the file is rendered by tools that may parse it as HTML.
 */
function escapeForInlineScript(s: string): string {
  return s.replace(/[<>&\u2028\u2029]/g, (c) => {
    switch (c) {
      case '<': return '\\u003c';
      case '>': return '\\u003e';
      case '&': return '\\u0026';
      case '\u2028': return '\\u2028';
      case '\u2029': return '\\u2029';
      default:  return c;
    }
  });
}

/**
 * Encode an arbitrary JS string (which may contain non-Latin-1 codepoints
 * like U+2028 / U+2029 from user-supplied build names) as base64 by going
 * through UTF-8 first. `btoa` alone throws InvalidCharacterError on any
 * codepoint > 0xFF.
 */
function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function buildExportHtml(
  build: BuildConfig,
  results: { daily: { total: { kwh: number; cost: number } }; monthly: { total: { kwh: number; cost: number } }; yearly: { total: { kwh: number; cost: number } } },
  currency: CurrencyInfo,
): string {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = escapeHtml(build.name);
  const json = JSON.stringify({ version: 1, build });
  const safeJson = escapeForInlineScript(json);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeName} — PC Power Calculator</title>
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
<h1>${safeName}</h1>
<p>Generated ${escapeHtml(date)} · pcpower.concreteinfo.co.in</p>
<table>
  <thead><tr><th>Period</th><th>Energy</th><th>Cost</th></tr></thead>
  <tbody>
    <tr><td>Daily</td><td>${formatKwh(results.daily.total.kwh)}</td><td>${formatCost(results.daily.total.cost, currency)}</td></tr>
    <tr><td>Monthly</td><td>${formatKwh(results.monthly.total.kwh)}</td><td>${formatCost(results.monthly.total.cost, currency)}</td></tr>
    <tr><td>Yearly</td><td>${formatKwh(results.yearly.total.kwh)}</td><td>${formatCost(results.yearly.total.cost, currency)}</td></tr>
  </tbody>
</table>
<a class="reimport" href="https://pcpower.concreteinfo.co.in/#/compare?builds=${encodeURIComponent(utf8ToBase64(json))}">Open in PC Power Calculator</a>
<script type="application/json" id="build-config">${safeJson}</script>
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
