import type { BuildConfig } from '@/types/build';
import type { ComponentCategory } from '@/types/component';
import { categoryColor } from '@/lib/categoryColors';
import { CALC_ENGINE_VERSION } from '@/lib/calc/version';
import { CONSUMPTION_TIERS, averageWallW, tierFor, tierPosition } from '@/lib/calc/classify';
import { equivalences } from '@/lib/calc/equivalences';
import {
  BASIS_LABEL,
  CATEGORY_LABEL,
  DEFAULT_GRID_FACTOR_KG_PER_KWH,
  REPORT_DISCLAIMER,
  istTimestamp,
  makeReportId,
  money as formatMoney,
  pdfKwh,
  pdfNum,
  reconciledTotals,
  type PdfReport,
} from './report';

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

function sectionTitle(title: string): string {
  return `<h2>${title}</h2>`;
}

interface BarRow {
  label: string;
  value: number;
  /** Right-hand readout, already formatted. */
  readout: string;
  /** CSS colour for the fill. */
  color: string;
}

/** Horizontal bars, the HTML twin of the PDF's vector chart. */
function barList(rows: BarRow[], max?: number): string {
  const scale = max ?? Math.max(...rows.map((r) => r.value), 1);
  return `<div class="bars">${rows
    .map((r) => {
      const pct = r.value > 0 && scale > 0 ? Math.max(1, (r.value / scale) * 100) : 0;
      return `<div class="bar-row"><span class="bar-label">${escapeHtml(
        r.label,
      )}</span><span class="bar-track"><span class="bar-fill" style="width:${pct.toFixed(
        1,
      )}%;background:${r.color}"></span></span><span class="bar-readout">${escapeHtml(
        r.readout,
      )}</span></div>`;
    })
    .join('')}</div>`;
}

interface KvRow {
  k: string;
  v: string;
  emphasis?: boolean;
  tone?: 'red' | 'green';
}

/** A labelled value row — the HTML twin of the PDF's zebra kv rows. */
function kvRows(rows: KvRow[]): string {
  return `<div class="kv">${rows
    .map(
      (r) =>
        `<div class="kv-row"><span class="k">${escapeHtml(r.k)}</span><span class="v${
          r.emphasis ? ' emphasis' : ''
        }${r.tone ? ` tone-${r.tone}` : ''}">${escapeHtml(r.v)}</span></div>`,
    )
    .join('')}</div>`;
}

/**
 * Build the standalone, branded, printable HTML report.
 *
 * Same data object as the PDF (`PdfReport`), same sections, wording and order,
 * so the two exports cannot tell different stories. The document is fully
 * self-contained: no images, icon fonts or external stylesheet/font requests,
 * so it renders offline from a file:// URL.
 */
export function buildExportHtml(report: PdfReport, build: BuildConfig): string {
  const currency = report.currency;
  const yearly = report.totals.yearly;
  const totals = reconciledTotals(report);
  const money = (amount: number) => formatMoney(amount, currency);

  const generatedAt = istTimestamp();
  // "21 Nov 2026, 14:45" → "21 Nov 2026". Kept IST, like the PDF.
  const date = generatedAt.slice(0, generatedAt.indexOf(','));
  const reportId = makeReportId(report.buildName);
  const gridFactor = report.gridFactorKgPerKwh ?? DEFAULT_GRID_FACTOR_KG_PER_KWH;
  const co2kg = yearly.kwh * gridFactor;
  const psu = report.psu;

  const subtitle = [report.buildCategory, report.locationLabel, report.tariffLabel]
    .filter(Boolean)
    .join('   |   ');

  const metaItems: Array<[string, string]> = [
    ['Report ID', reportId],
    ['Generated', `${generatedAt} IST`],
    ['System', report.buildName],
    ['Location', report.locationLabel],
    ['Tariff currency', `${currency.code} (${currency.symbol.trim()})`],
    ['Engine', `v${CALC_ENGINE_VERSION}`],
    [
      'Tariff source',
      `${report.tariffSource ?? 'Compiled'}${report.tariffVerifiedAt ? ` · ${report.tariffVerifiedAt}` : ''}`,
    ],
    ['Catalog data verified', report.catalogVerifiedAt ?? '—'],
  ];
  const metaHtml = metaItems
    .map(
      ([k, v]) =>
        `<div class="meta-cell"><span class="meta-k">${escapeHtml(
          k,
        )}</span><span class="meta-v">${escapeHtml(v)}</span></div>`,
    )
    .join('');

  const heroHtml = `<section class="hero">
  <span class="hero-label">ESTIMATED ANNUAL RUNNING COST</span>
  <div class="hero-line"><span class="hero-amount">${money(totals.yearly)}</span><span class="hero-per">per year</span></div>
  <div class="facts">
    <div><span class="fact-k">Per month</span><span class="fact-v fact-month">${money(report.totals.monthly.cost)}</span></div>
    <div><span class="fact-k">Per day</span><span class="fact-v fact-day">${money(report.totals.daily.cost)}</span></div>
    <div><span class="fact-k">Energy / year</span><span class="fact-v fact-energy">${pdfKwh(yearly.kwh)}</span></div>
  </div>
</section>`;

  /* ── 1. Where the power goes ─────────────────────────────────────────── */
  const byCategory = new Map<ComponentCategory, number>();
  for (const d of report.devices) {
    if (d.category === 'psu') continue;
    byCategory.set(d.category, (byCategory.get(d.category) ?? 0) + (d.unitW ?? 0) * d.qty);
  }
  const totalComponentW = [...byCategory.values()].reduce((a, b) => a + b, 0);
  const powerRows: BarRow[] = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, w]) => ({
      label: CATEGORY_LABEL[cat] ?? cat,
      value: w,
      readout: `${pdfNum(w)} W · ${
        totalComponentW > 0 ? Math.round((w / totalComponentW) * 100) : 0
      }%`,
      color: categoryColor(cat).hex,
    }));
  const powerSection = `<section>
${sectionTitle('Where the power goes')}
<p>${escapeHtml(
    `Share of the ${pdfNum(
      totalComponentW,
    )} W estimated typical component draw, by part category. The PSU is excluded: it converts power rather than consuming it.`,
  )}</p>
${powerRows.length > 0 ? barList(powerRows) : '<p>No components selected.</p>'}
</section>`;

  /* ── 2. What each use case costs ─────────────────────────────────────── */
  let useCaseSection = '';
  if (report.schedule.length > 0) {
    const scheduleTotal = totals.yearly;
    const maxCost = Math.max(...report.schedule.map((s) => s.costYear), 1);
    const costRows: BarRow[] = report.schedule
      .slice()
      .sort((a, b) => b.costYear - a.costYear)
      .map((s) => ({
        label: s.name,
        value: s.costYear,
        readout: `${money(s.costYear)} · ${pdfKwh(s.kwhYear)}`,
        color: '#6a5acd',
      }));
    useCaseSection = `<section>
${sectionTitle('What each use case costs')}
<p>${escapeHtml(
      `Bars are scaled to the largest single use case (${money(
        maxCost,
      )}). The schedule totals ${money(scheduleTotal)} a year.`,
    )}</p>
${barList(costRows, maxCost)}
</section>`;
  }

  /* ── 3. How these figures are calculated ─────────────────────────────── */
  const steps = [
    'Component draw: each part contributes its rated wattage (or the basis shown in the table). Overclock adds a percentage on top of the CPU and GPU figures.',
    'Workload draw: each use case applies a utilisation factor to those components — office and browsing run a fraction of full load, gaming and rendering run close to it.',
    'Idle draw: a small fixed share of each component for the hours the machine is on but not working.',
    "PSU conversion: component draw is divided by the supply's efficiency at that load (a load-dependent 80 PLUS curve), giving the wall figure the meter sees.",
    'Energy: wall watts x hours per day x days per week, summed across use cases and idle, then annualised.',
    'Cost: energy is priced through the regional tariff, including slab tiers and taxes where the tariff data provides them.',
  ];
  const tariffNote = report.tariffEstimated
    ? `* The tariff used is an estimated rate (${
        report.tariffSource ?? 'compiled band'
      }), not a verified bill for a specific distributor. Override it with your own rate for an exact figure.`
    : `Tariff source: ${report.tariffSource ?? 'compiled published tariffs'}, ${
        report.tariffVerifiedAt ?? 'date not recorded'
      }.`;
  const methodSection = `<section>
${sectionTitle('How these figures are calculated')}
<ol class="steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
<p class="footnote">${escapeHtml(tariffNote)}</p>
</section>`;

  /* ── 4. Idle, typical and maximum ────────────────────────────────────── */
  const idleSection = `<section>
${sectionTitle('Idle, typical and maximum')}
${kvRows([
    { k: 'Idle (on, nothing running — wall)', v: `${pdfNum(report.idleWallW)} W` },
    { k: 'Typical (components at rated draw — DC)', v: `${pdfNum(report.typicalComponentW)} W` },
    { k: 'Maximum (all components at 100% — wall)', v: `${pdfNum(psu.peakWallW)} W` },
  ])}
<p>Idle is the figure that decides a 24x7 NAS or server bill: it runs every hour the machine is on. A machine that idles 100 W for 20 hours costs more than one that peaks at 400 W for two.</p>
</section>`;

  /* ── 5. Components ───────────────────────────────────────────────────── */
  const deviceRows = report.devices.filter((d) => d.category !== 'psu');
  const deviceTable = deviceRows
    .map(
      (d) => `<tr>
<td>${escapeHtml(d.name)}</td>
<td style="color:${categoryColor(d.category).hex}">${escapeHtml(
          CATEGORY_LABEL[d.category] ?? d.category,
        )}</td>
<td class="num">${d.qty}</td>
<td class="num">${d.unitW != null ? pdfNum(d.unitW) : '—'}</td>
<td class="num">${d.unitW != null ? pdfNum(d.totalW) : '—'}</td>
<td class="basis ${d.basis}">${escapeHtml(BASIS_LABEL[d.basis])}</td>
</tr>`,
    )
    .join('');
  const componentsSection = `<section>
${sectionTitle('Components')}
<table>
<thead><tr><th>Device</th><th>Category</th><th class="num">Qty</th><th class="num">W / unit</th><th class="num">Total W</th><th>Basis</th></tr></thead>
<tbody>${deviceTable}</tbody>
<tfoot><tr><td colspan="4">Estimated typical component draw (DC)</td><td class="num">${pdfNum(
    report.typicalComponentW,
  )}</td><td></td></tr></tfoot>
</table>
<p class="footnote">Rated = the manufacturer's published figure. Measured = from independent testing. Estimated = derived by the calculator where no figure was published. These are component (DC) figures, before power-supply conversion.</p>
</section>`;

  /* ── 6. Power supply ─────────────────────────────────────────────────── */
  const additional = psu.ratedW != null ? psu.ratedW - psu.recommendedW : null;
  const psuRows: KvRow[] = [
    { k: 'Estimated typical component draw (DC)', v: `${pdfNum(report.typicalComponentW)} W` },
    { k: 'Estimated maximum system draw (wall, AC)', v: `${pdfNum(psu.peakWallW)} W` },
    { k: 'Recommended PSU capacity', v: `${pdfNum(psu.recommendedW, 0)} W`, emphasis: true },
    {
      k: 'Installed PSU capacity',
      v: psu.ratedW != null ? `${pdfNum(psu.ratedW, 0)} W` : 'Not selected',
    },
    {
      k: 'Additional capacity',
      v: additional == null ? '—' : `${additional >= 0 ? '+' : ''}${pdfNum(additional, 0)} W`,
      tone: additional == null ? undefined : additional < 0 ? 'red' : 'green',
    },
    {
      k: 'Model / certification',
      v: [psu.name, psu.certification].filter(Boolean).join(' · ') || '—',
    },
    {
      k: 'Conversion efficiency at this load',
      v: psu.efficiencyAtLoad != null ? `${Math.round(psu.efficiencyAtLoad * 100)}%` : '—',
    },
    {
      k: 'UPS conversion efficiency',
      v:
        report.upsEfficiency && report.upsEfficiency < 1
          ? `${Math.round(report.upsEfficiency * 100)}%`
          : 'No UPS in the path',
    },
    {
      k: 'Peak draw lost to PSU conversion',
      v:
        psu.efficiencyAtLoad != null
          ? `${pdfNum(psu.peakWallW * (1 - psu.efficiencyAtLoad))} W`
          : '—',
    },
  ];
  const undersized =
    psu.ratedW != null && psu.ratedW < psu.recommendedW
      ? `<div class="warning">${escapeHtml(
          `Installed supply is ${pdfNum(
            psu.recommendedW - psu.ratedW,
            0,
          )} W below the recommendation — undersized for sustained full load.`,
        )}</div>`
      : '';
  const psuSection = `<section>
${sectionTitle('Power supply')}
${kvRows(psuRows)}
<p>${escapeHtml(
    "The recommendation is a practical PSU size: peak component draw plus 35% headroom for transient spikes and capacitor ageing, rounded up to the nearest standard rating — not peak draw multiplied by 1.35 exactly. Wall draw is component draw divided by the supply's conversion efficiency at this load (P_wall = P_components / efficiency).",
  )}</p>
${undersized}
</section>`;

  /* ── 7. Carbon footprint ─────────────────────────────────────────────── */
  const carbonSection = `<section>
${sectionTitle('Carbon footprint')}
${kvRows([
    { k: 'Annual energy', v: pdfKwh(yearly.kwh) },
    { k: 'Grid factor used', v: `${pdfNum(gridFactor, 2)} kg CO2e / kWh` },
    { k: 'Estimated annual emissions', v: `${pdfNum(co2kg, 1)} kg CO2e`, emphasis: true },
    {
      k: 'Equivalent',
      v: `${pdfNum((co2kg * 5) / 1000, 2)} tonnes over 5 years at this usage`,
    },
  ])}
<p>${escapeHtml(
    "A grid factor is an average, not a promise: it varies by state, season and time of day, and a supplier's published fuel mix will differ from it. Change the factor to your own supplier or state figure before quoting this number.",
  )}</p>
</section>`;

  /* ── 8. What this means ──────────────────────────────────────────────── */
  const avgW = averageWallW(yearly.kwh);
  const tier = tierFor(avgW);
  const allEq = equivalences(yearly.kwh, co2kg);
  const carrier = [
    ...allEq.filter((e) => e.group === 'carbon').slice(0, 1),
    ...allEq.filter((e) => e.group === 'fuel').slice(0, 3),
    ...allEq.filter((e) => e.group === 'water').slice(0, 1),
    ...allEq.filter((e) => e.group === 'everyday').slice(0, 1),
  ];
  // Same six unit conversions, and the same key/value shape, as the PDF.
  const equivalenceRows = kvRows(
    carrier.map((e) => ({ k: e.sentence, v: `${e.value} ${e.unit}` })),
  );
  const gaugeSegments = CONSUMPTION_TIERS.map((t, i) => {
    const left = tierPosition(t.from);
    const right = tierPosition(t.to ?? 1000);
    return `<span class="gauge-seg" style="left:${left.toFixed(1)}%;width:${Math.max(
      1,
      right - left,
    ).toFixed(1)}%;background:rgb(${250 - i * 9}, ${232 - i * 24}, ${230 - i * 24})"></span>`;
  }).join('');
  const looksLike = report.suggestedCategory
    ? `<p class="ink"><strong>Looks like: ${escapeHtml(
        report.suggestedCategory.label,
      )} - ${escapeHtml(report.suggestedCategory.reason)}</strong></p>`
    : '';
  const meaningSection = `<section>
${sectionTitle('What this means')}
<div class="gauge">${gaugeSegments}<span class="gauge-marker" style="left:${tierPosition(
    avgW,
  ).toFixed(1)}%"></span></div>
<p class="tier-line">${escapeHtml(
    `${tier.label} - ${pdfNum(avgW)} W average, ${pdfKwh(yearly.kwh)} a year`,
  )}</p>
<p>${escapeHtml(tier.blurb)}</p>
${looksLike}
${equivalenceRows}
<p class="footnote">These are unit conversions of the annual kWh figure, not measurements: coal at 24 MJ/kg and 35% plant efficiency (0.43 kg/kWh), gas at 36 MJ/m3 and 55% CCGT (0.18 m3/kWh), diesel at 38.6 MJ/L and 35% genset (0.27 L/kWh), cooling water 1.8 L/kWh, solar 1,400 kWh per kWp per year.</p>
</section>`;

  /* ── 9. Estimated versus measured ────────────────────────────────────── */
  const measured = report.measured;
  const hasMeasured =
    measured != null && (measured.idle_w || measured.load_w || measured.avg_w);
  let measuredBody: string;
  if (hasMeasured) {
    const rows: Array<[string, number, number]> = [];
    if (measured?.idle_w) rows.push(['Idle draw (wall)', report.idleWallW, measured.idle_w]);
    if (measured?.load_w) rows.push(['Full load (wall)', psu.peakWallW, measured.load_w]);
    if (measured?.avg_w) {
      const modelAvg =
        report.totals.daily.kwh > 0 ? (report.totals.daily.kwh * 1000) / 24 : 0;
      rows.push(['Daily average (wall)', modelAvg, measured.avg_w]);
    }
    measuredBody = `${kvRows(
      rows.map(([k, model, real]) => {
        const delta = model > 0 ? Math.round(((real - model) / model) * 100) : 0;
        return {
          k: `${k} — model ${pdfNum(model)} W`,
          v: `${pdfNum(real)} W (${delta > 0 ? '+' : ''}${delta}%)`,
          tone: Math.abs(delta) > 20 ? ('red' as const) : ('green' as const),
        };
      }),
    )}
<p>Your meter is the authoritative figure. A gap above 20% usually means one of: unbooked hours the machine is actually on, a part drawing more than its rating, or a supply running outside its efficiency sweet spot.</p>`;
  } else {
    measuredBody =
      '<p>No meter readings were entered for this build. Add a smart-plug reading in the calculator (How accurate is this?) and this section will show the model against reality, reading by reading.</p>';
  }
  const measuredSection = `<section>
${sectionTitle('Estimated versus measured')}
${measuredBody}
</section>`;

  /* ── Footer + embedded config ────────────────────────────────────────── */
  const json = JSON.stringify({ version: 1, build });
  const safeJson = escapeForInlineScript(json);
  const reimportHref = `https://pcpower.concreteinfo.co.in/compare?builds=${encodeURIComponent(
    utf8ToBase64(json),
  )}`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(report.buildName)} — PC Power Calculator report</title>
<style>
  :root { color-scheme: light dark; }
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    margin: 0;
    background: #fff;
    color: #1f2937;
    font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
    font-size: 15px;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page { max-width: 780px; margin: 0 auto; padding: 28px 28px 40px; background: #fff; }
  .brandbar {
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap;
    background: #c93a18; color: #fff;
    padding: 10px 16px; border-radius: 8px 8px 0 0;
    font-size: 12px; letter-spacing: .06em;
  }
  .brandbar .brand { font-weight: 700; letter-spacing: .14em; }
  .brandbar .ref {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums; letter-spacing: 0;
  }
  h1 { font-size: 28px; line-height: 1.2; margin: 26px 0 4px; color: #1f2937; overflow-wrap: anywhere; }
  .subtitle { margin: 0 0 20px; color: #6b7280; font-size: 13px; }
  .meta {
    display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0 0 24px;
    background: #fafbfc; border: 1px solid #e5e7eb; border-radius: 12px;
    overflow: hidden;
  }
  .meta-cell { padding: 10px 12px; border-top: 1px solid #e5e7eb; }
  .meta-cell:nth-child(-n+4) { border-top: 0; }
  .meta-k {
    display: block; margin-bottom: 3px;
    font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #6b7280;
  }
  .meta-v {
    display: block; font-size: 12.5px; font-weight: 700; color: #1f2937;
    overflow-wrap: anywhere;
  }
  section { margin: 22px 0; }
  .hero { margin: 0 0 8px; padding: 4px 0 20px; }
  .hero-label {
    font-size: 11px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #6b7280;
  }
  .hero-line { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
  .hero-amount {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    font-size: 40px; line-height: 1.1; font-weight: 700; color: #e5461f;
    letter-spacing: -.01em;
  }
  .hero-per { font-size: 14px; color: #6b7280; }
  .facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 18px; }
  .fact-k {
    display: block; font-size: 10.5px; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; color: #6b7280;
  }
  .fact-v {
    display: block; margin-top: 2px;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    font-size: 17px; font-weight: 700;
  }
  .fact-month { color: #c93a18; }
  .fact-day { color: #0b6f96; }
  .fact-energy { color: #1a7a56; }
  h2 {
    margin: 0 0 8px; padding-top: 16px; border-top: 1px solid #e5e7eb;
    font-size: 12.5px; line-height: 1.3; letter-spacing: .1em;
    text-transform: uppercase; color: #1f2937;
  }
  p { margin: 0 0 10px; color: #6b7280; font-size: 14px; }
  p.ink { color: #1f2937; }
  p.footnote { font-size: 12px; }
  .bars { display: grid; gap: 8px; margin: 12px 0 4px; }
  .bar-row {
    display: grid; grid-template-columns: minmax(84px, 132px) minmax(0, 1fr) auto;
    align-items: center; gap: 10px;
  }
  .bar-label { font-size: 12.5px; color: #1f2937; }
  .bar-track { height: 10px; border-radius: 4px; background: #f1f3f5; overflow: hidden; }
  .bar-fill { display: block; height: 100%; border-radius: 4px; min-width: 2px; }
  .bar-readout {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    font-size: 11.5px; color: #6b7280; white-space: nowrap;
  }
  .kv { margin: 10px 0; border-radius: 8px; overflow: hidden; }
  .kv-row {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 16px; padding: 7px 10px; font-size: 13.5px;
  }
  .kv-row:nth-child(odd) { background: #fafbfc; }
  .kv-row .k { color: #6b7280; }
  .kv-row .v {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums;
    font-weight: 700; color: #1f2937; text-align: right;
  }
  .kv-row .emphasis { font-size: 14.5px; }
  .tone-red { color: #b91c1c !important; }
  .tone-green { color: #1a7a56 !important; }
  ol.steps { margin: 6px 0 10px; padding-left: 20px; color: #6b7280; font-size: 13px; }
  ol.steps li { margin-bottom: 5px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 12px; font-size: 12.5px; }
  thead th {
    background: #e5461f; color: #fff; text-align: left;
    font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase;
    padding: 8px 10px;
  }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  tfoot td { padding: 8px 10px; background: #f3f4f6; font-weight: 700; }
  td.num, th.num {
    text-align: right;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  td.basis.estimated { color: #a15c07; font-weight: 700; }
  td.basis.measured { color: #1a7a56; font-weight: 700; }
  .warning {
    margin: 10px 0; padding: 10px 12px; border-radius: 8px;
    background: #fef2f2; color: #b91c1c; font-size: 13px; font-weight: 700;
  }
  .gauge { position: relative; height: 10px; margin: 12px 0 14px; }
  .gauge-seg { position: absolute; top: 0; bottom: 0; }
  .gauge-marker {
    position: absolute; top: -3px; bottom: -3px; width: 3px;
    background: #e5461f; border-radius: 2px;
  }
  .tier-line { margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #1f2937; }
  .report-footer {
    margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;
    font-size: 11.5px; color: #6b7280;
  }
  .footer-row {
    display: flex; justify-content: space-between; align-items: center;
    gap: 16px; flex-wrap: wrap; margin-bottom: 8px;
  }
  .report-footer a { color: #c93a18; }
  .disclaimer { font-size: 11px; margin: 8px 0; }
  .reimport {
    display: inline-block; background: #e5461f; color: #fff !important;
    text-decoration: none; padding: 9px 14px; border-radius: 8px;
    font-weight: 700; font-size: 12px;
  }
  .print-footer { display: none; }

  /*
   * Screen only: a reader with the OS in dark mode who prints this report
   * would otherwise send a near-black page to the printer, because the print
   * block below re-inks the body but every dark surface rule would still win
   * the cascade.
   */
  @media screen and (prefers-color-scheme: dark) {
    body { background: #0d0b09; color: #e5e7eb; }
    .page { background: #1a1a1a; }
    .brandbar { background: #c93a18; }
    /* p.ink and ol.steps carry their own colour at class specificity, so they
       must be named here — the bare p rule cannot reach them. */
    h1, .meta-v, .bar-label, .kv-row .v, .tier-line, p.ink { color: #f3f4f6; }
    .subtitle, p, .meta-k, .fact-k, .hero-label, .hero-per, .bar-readout,
    .kv-row .k, .report-footer, ol.steps { color: #a1a1aa; }
    .meta { background: #141414; border-color: #333; }
    .meta-cell { border-top-color: #333; }
    h2 { color: #e5e7eb; border-top-color: #333; }
    .bar-track { background: #2a2a2a; }
    .kv-row:nth-child(odd) { background: #202020; }
    thead th { background: #c93a18; }
    tbody td { border-bottom-color: #333; }
    tbody tr:nth-child(even) { background: #1f1f1f; }
    tfoot td { background: #242424; }
    .warning { background: #2a1414; color: #fca5a5; }
    .fact-month { color: #ff9d82; }
    .fact-day { color: #6cc9fa; }
    .fact-energy { color: #34d399; }
    .report-footer { border-top-color: #333; }
    .report-footer a { color: #ff9d82; }
    .reimport { background: #c93a18; }
    .tone-red { color: #fca5a5 !important; }
    .tone-green { color: #34d399 !important; }
    td.basis.estimated { color: #fbbf24; }
    td.basis.measured { color: #34d399; }
  }

  @page { size: A4; margin: 16mm 14mm; }
  @media print {
    body { background: #fff; color: #1f2937; }
    .page { max-width: none; margin: 0; padding: 0 0 28px; }
    .brandbar { border-radius: 0; }
    .screen-only { display: none !important; }
    section { break-inside: avoid; }
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    /*
     * Chromium does not support @page margin boxes (@bottom-center &c.), so a
     * browser print cannot number pages. A position:fixed strip repeats the
     * report ID and site on every printed page instead.
     */
    .print-footer {
      display: block; position: fixed; bottom: 0; left: 0; right: 0;
      padding-top: 4px; border-top: 1px solid #e5e7eb; background: #fff;
      color: #6b7280; font-size: 9px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-variant-numeric: tabular-nums;
    }
  }

  /* Faint brand watermark. Fixed so it repeats on every printed page, and
     pointer-events:none so it never intercepts clicks on the report. */
  .watermark {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 0; overflow: hidden;
  }
  .watermark span {
    transform: rotate(-30deg);
    font-size: clamp(28px, 6vw, 72px);
    font-weight: 800; letter-spacing: .08em;
    color: #e5461f; opacity: .05; white-space: nowrap;
  }
  @media (max-width: 560px) {
    .meta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .meta-cell:nth-child(-n+4) { border-top: 1px solid #e5e7eb; }
    .meta-cell:nth-child(-n+2) { border-top: 0; }
    .bar-row { grid-template-columns: minmax(70px, 104px) minmax(0, 1fr); }
    .bar-readout { grid-column: 2; text-align: right; }
  }
</style>
</head>
<body>
<div class="watermark" aria-hidden="true"><span>ConcreteInfo PC Power Consumption Calculator</span></div>
<div class="page">
  <header class="brandbar">
    <span class="brand">PC POWER CALCULATOR</span>
    <span class="ref">${escapeHtml(currency.code)} report · ${escapeHtml(date)} · ${escapeHtml(reportId)}</span>
  </header>
  <main>
    <h1>${escapeHtml(report.buildName)}</h1>
    <p class="subtitle">${escapeHtml(subtitle)}</p>
    <div class="meta">${metaHtml}</div>
    ${heroHtml}
    ${powerSection}
    ${useCaseSection}
    ${methodSection}
    ${idleSection}
    ${componentsSection}
    ${psuSection}
    ${carbonSection}
    ${meaningSection}
    ${measuredSection}
  </main>
  <footer class="report-footer">
    <div class="footer-row">
      <strong>Generated by PC Power Calculator&nbsp; | &nbsp;A ConcreteInfo product</strong>
    </div>
    <div class="footer-row">
      <a href="https://pcpower.concreteinfo.co.in">pcpower.concreteinfo.co.in</a>
      <span>Report ID ${escapeHtml(reportId)} · ${escapeHtml(date)} (IST)</span>
    </div>
    <p class="disclaimer">${REPORT_DISCLAIMER}</p>
    <div class="footer-row">
      <span>© 2026 ConcreteInfo</span>
      <a class="reimport screen-only" href="${escapeHtml(reimportHref)}">Open in PC Power Calculator</a>
    </div>
  </footer>
</div>
<div class="print-footer" aria-hidden="true">pcpower.concreteinfo.co.in · Report ID ${escapeHtml(reportId)} · ${escapeHtml(date)} (IST)</div>
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
