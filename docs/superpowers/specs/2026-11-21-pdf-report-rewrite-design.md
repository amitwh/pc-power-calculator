# PDF report rewrite — flow layout with @react-pdf/renderer

**Date:** 2026-11-21
**Status:** approved direction (user chose "Rebuild with react-pdf")
**Replaces:** the manual jsPDF renderer in `src/lib/export/pdf.ts` (941 lines)

## Why

A real report was generated from a seven-part build (Ryzen 7 7800X3D, RX 7800XT,
650 W Bronze, one monitor, 4+8+4 h schedule, 2 h idle, meter readings) and
inspected at 110 dpi. The data is strong; the document around it is not:

1. **A near-empty page.** The Idle/Typical/Max block spills onto page 2, then an
   unconditional `doc.addPage()` starts the component table on page 3. Four pages
   where the report's own comment says "two-page".
2. **Legal text cut mid-sentence on every page.** The footer prints
   `lines.slice(0, 2)` of a three-line disclaimer, ending at "…Verify
   specifications with the".
3. **Metadata values truncated.** The four-column grid keeps only the first
   wrapped line, so the tariff source reads "DISCOM tariff orders," and the
   currency cell reads `INR (Rs. )`.
4. **Two annual totals on the same page.** Hero `Rs. 10,413.14`; schedule
   sentence `Rs. 10,413.10` (row rounding vs exact total).
5. **Core-font substitutions.** Helvetica forces `₹ → Rs.`, `CO₂e → COe`,
   `× → x`, and drops `≈`. Page 4 literally prints "1,056 kg of COe".
6. **Label defects.** The subtitle prints the raw id `gaming`; the synthetic
   case-fan row is labelled "Peripheral"; the estimated-tariff asterisk is
   described but never marked.
7. **No continuation context.** Pages 2–4 have no build name or report ID in a
   running header, and the PDF is untagged.

The root cause of (1), (3) and much of the rest is structural: jsPDF has no flow
engine, so the renderer maintains a manual `y` cursor and hard-breaks pages.
`@react-pdf/renderer` provides flex layout, automatic page wrapping, font
embedding and links, which removes that whole defect class instead of patching it.

## Goals

- A typical build (≤15 components, ≤5 workloads) renders as **2–3 dense A4
  pages**, with no page that is mostly blank.
- **No clipped text anywhere**: metadata values, footer disclaimer, table cells.
- **One number appears once**: the hero yearly cost equals the sum of the printed
  per-workload rows.
- **Brand typography**: embedded Inter for prose and JetBrains Mono for figures,
  so `₹`, `CO₂e`, `×`, `—`, `≈` render as themselves.
- **Brand mark**: the page-1 header uses the repo's logo and the square webicon
  once supplied; until then a text wordmark fallback keeps the report complete.
- **A way back into the app**: a QR code and clickable link to the existing
  stateless `/build/<token>` permalink, when the encoded URL is within the
  existing 6 KB cap.
- **Continuation header** on pages 2+, and a footer with `Page X of Y`, report ID
  and IST date.
- Metadata: title, author, subject, keywords, language `en-IN`.
- Client-side only, lazy-loaded, and exportable offline once the app is installed.
- The HTML export keeps its design; the only content change is that its schedule
  total is corrected to agree with the PDF (a shared bug fix, not a redesign).

## Non-goals

- Server-side rendering, accounts, or cloud storage of reports.
- Tagged PDF / PDF-UA. `@react-pdf/renderer` does not emit tagged PDFs today; the
  document keeps a real text layer and logical reading order, and the limitation
  is stated in the module doc rather than claimed away.
- New report sections or new data fields beyond the current `PdfReport`.
- A server-side QR verification page: the share token is stateless.
- Changing the calculation engine, catalog, tariffs, or the HTML report layout.

## Constraints

- Static Vite build; no runtime server. PDF generation happens in the browser.
- `PdfReport` is the shared contract with `html.ts`; its shape must not change.
- The PWA precache glob currently covers `woff2` but not `ttf`
  (`vite.config.ts`); report fonts must be precached for offline export.
- Today only `jspdf` is dynamically imported inside a statically imported
  wrapper. The rewrite must move the dynamic boundary around the **whole
  renderer**: `ExportMenu` calls `await import('@/lib/export/pdf')` inside
  `onPdf`, and the barrel must not statically re-export the renderer.
- Dependency policy: verify latest stable + OSV. Verified 2026-11-21:
  `@react-pdf/renderer` 4.9.0 (peer `react ^16.8 || ^17 || ^18 || ^19`, OSV
  clean) and `qrcode` 1.5.4 (OSV clean). Re-verify before pinning.
- **Brand assets are arriving separately.** The owner will add a logo and a
  webicon to the repo. The renderer must ship without them (text fallback) and
  pick them up without code changes once the files exist.

## Approaches considered

1. **Patch the jsPDF renderer.** Fix the forced break, wrap footer/meta text,
   unify totals, embed a TTF. Low risk, but keeps the manual cursor that causes
   the class of bug, and jsPDF's font handling stays awkward (no layout engine).
2. **Rebuild with `@react-pdf/renderer`.** *Chosen.* Flow layout and font
   embedding solve pagination and glyph coverage structurally. Cost: a renderer
   rewrite and a larger lazy chunk.
3. **Server-side HTML → PDF (Chromium/WeasyPrint).** Rejected: the app is a
   static PWA with no runtime; adding a service contradicts the stateless,
   nothing-uploaded promise.

## The design

### Module split

| File | Responsibility |
|---|---|
| `src/lib/export/report.ts` | `PdfReport` and row types, labels, `REPORT_DISCLAIMER`, formatters, `reportFileName`, `istTimestamp`, `makeReportId`, `sumRounded`, `basisFor`, `certificationLabel` |
| `src/lib/export/pdf.tsx` | The react-pdf document components and `exportPdf(report, opts)` |
| `src/lib/export/html.ts` | Imports shared helpers from `./report` (no visual change) |
| `src/lib/export/index.ts` | Re-exports `report` and `html` only — never the renderer, so `@react-pdf/renderer` cannot enter the main bundle |

`ExportMenu.tsx` keeps building the same `PdfReport`. Its PDF import moves to the
new module; it also computes the share URL and QR data URL before calling
`exportPdf`.

**Unicode-safe formatting.** The current `pdfText()` strips glyphs for WinAnsi.
With embedded fonts it is no longer needed. `money()` returns `formatCost()`
unchanged, so the PDF prints `₹10,413.14` exactly like the HTML report. Tests
that assert `Rs.` are updated to assert `₹`.

### Document structure

A4, 36 pt margins. One `<Page>` for flow; the footer and continuation header are
`fixed`. Page 1 carries the brand bar; continuation pages carry a compact header
with build name · report ID.

Sections, in order:

1. Brand bar, build name, category label (not the raw id), location · tariff.
2. Metadata grid — wrapped values, no first-line slicing.
3. Hero: yearly cost, per month/day, energy/year.
4. Where the power goes — category bars, percentage readouts.
5. What each use case costs — bars, kWh, and the schedule total.
6. How these figures are calculated — numbered method steps.
7. Idle, typical and maximum.
8. Components table — zebra rows, category colour, basis column.
9. Power supply.
10. Carbon footprint.
11. What this means — consumption gauge and equivalences.
12. Estimated versus measured (or the empty-state line).
13. Full disclaimer, once, as a closing block.

Each section is a `<View wrap={false}>` so it never splits awkwardly. The
components table is chunked (20 rows per chunk, header repeated per chunk) because
react-pdf has no native repeating table header. No explicit page breaks; flow
decides.

**Footer (every page):** `Generated by PC Power Calculator · A ConcreteInfo
product` left, `Page X of Y` right, then site link and `Report ID … · DD Mon
YYYY (IST)`, then a one-line short disclaimer. The full disclaimer is a closing
block on the last page, so nothing is ever truncated.

**QR and link.** `ExportMenu` calls the existing `buildPermalinkUrl(buildJson)`.
When it returns a URL, `qrcode.toDataURL()` produces a PNG data URL at export
time (browser only) and `exportPdf` places it as a closing block on the last page
— the cover is already full and the last page has the whitespace — with the
caption "Scan to open this build". When the URL exceeds the 6 KB cap, no QR is
drawn and the site URL is linked instead — no silent truncation.

### Money consistency

One shared helper, used by **both** renderers:

```ts
// report.ts
export function reconciledTotals(report: PdfReport) {
  const rows = report.schedule.map((r) => roundMoney2(r.costYear));
  const yearly = roundMoney2(rows.reduce((a, b) => a + b, 0));
  return { rows, yearly };
}
```

- Every printed amount is 2 decimals (`roundMoney2`), the precision both exports
  already display. The schedule sentence and the hero both use `yearly`, so the
  two numbers on page 1 are the same number.
- The engine's unrounded total equals the unrounded row sum; the displayed figure
  is the rounded row sum, which is what a reader can add up.
- Monthly and daily stay engine values — they are separately computed periods,
  shown in the app too, and changing them would make the report disagree with the
  calculator.
- Because the helper is shared, the HTML report gets the same fix. That is a
  content correction only; its layout and styling do not change.

### Label corrections (report layer only)

- The build category in the subtitle uses `CATEGORY_LABEL`/the build-category
  label, never the raw id.
- The synthetic case-fan row is displayed as **"Case fan"**, mapped in the report
  layer from `CASE_FANS_ID` / the "Case fans ×N" name. The calculation engine's
  `peripheral` category is not changed — that would alter `power.ts` behaviour and
  violates the non-goal.
- The estimated-tariff asterisk is printed next to the tariff figure when
  `tariffEstimated` is true, matching the explanatory sentence.
- The carbon "Equivalent" row prints **five-year** tonnes (`annual × 5 / 1000`).
  Both legacy renderers printed annual tonnes under a five-year label; the HTML
  export gets the same correction (content only).

### Fonts

Static TTFs sourced from the **upstream OFL releases** (the Inter release and the
JetBrains Mono release), then pre-subset and committed under
`public/fonts/report/`. The vendored `@fontsource-variable` packages ship only
WOFF2, so they cannot supply the renderer's font files; instancing them would add
a fonttooling step for no benefit. The upstream licence files are committed
beside the fonts.

- Inter Regular, SemiBold, Bold (prose, headings)
- JetBrains Mono Regular (figures)

Subset to Latin + the glyphs the report uses (`₹ U+20B9`, `—`, `–`, `×`, `≈`,
`·`, `₂`, `³`, curly quotes) with `pyftsubset`; target ~30–60 KB per file.
`Font.register` lives in a small module; the
`ttf` extension is added to the PWA precache glob so an installed app can export
offline. Verification: `pdftotext` output contains `₹`, `CO₂e`, `×` and no
`.notdef` glyph.

### Brand assets (logo + webicon)

The owner is adding a logo and a webicon to the repo. The renderer treats both as
optional inputs with a working fallback, so the rewrite can ship before they land.

- **Source files (supplied):** `assets/logo.png` (2167 × 726, RGBA, transparent)
  and `assets/appicon.png` (570 × 570, RGB, white background). Copy them to
  `public/brand/logo.png` and `public/icons/appicon.png` so the runtime can fetch
  them; keep `assets/` as the owner's source of truth.
- **Placement:** page-1 brand bar shows the full lockup on a **white rounded
  plate** — its wordmark is navy and its gauge orange, so it cannot sit directly
  on the `#e5461f` bar. Height ~18–20 pt. Continuation headers show the square
  appicon on a small white plate plus build name · report ID; footer unchanged.
- **Format:** PNG (both supplied assets). react-pdf renders PNG reliably. The
  spike proved SVG also works, but SVG `<text>` needs a registered font; a PNG
  logo avoids that trap entirely.
- **Appicon background:** the square icon is RGB with white corners. It is always
  placed on a white plate, never directly on orange. For the PWA maskable icon,
  regenerate the icon set from this source so the launcher icon matches.
- **Webicon:** replace the generic generated icons by running the project's
  `npm run generate-pwa-assets` with `assets/appicon.png` as the source (update
  `pwa-assets.config.ts` and the manifest/index references if the output names
  change).
- **Fallback:** when the logo cannot be fetched, draw the current text wordmark.
  No broken-image box, no layout shift.

### Testing

- **Unit:** formatters (`₹`, lakh grouping), `sumRounded`, filename IST date,
  report ID stability.
- **Render smoke (Node):** build the document and render to a buffer; assert a
  `%PDF-` header and non-trivial size. A scripted check with `pdftotext` (skipped
  when poppler is absent) asserts `Page 1 of N`, `₹`, `CO₂e` and the full
  disclaimer are present.
- **Browser e2e:** seed a build, click Export PDF, assert the download event and
  the filename; render the page to PNG for a visual check.
- **Bundle:** record the lazy chunk size before/after; fail the review if it grows
  beyond a reasonable ceiling (~500 KB gzip) without a stated reason.

## Resolved in builder review (2026-11-21)

- **Totals:** reconciliation lives in the shared `report.ts` helper and applies to
  both exports. The HTML report gets the same content fix (no redesign). Monthly
  and daily remain engine values.
- **Lazy boundary:** `index.ts` re-exports `report` and `html` only; `ExportMenu`
  dynamically imports the renderer inside `onPdf`; `Font.register` stays inside
  the lazy module.
- **Case fans:** display-only relabel in the report layer; the calculation engine
  is untouched.
- **Font source:** upstream OFL static TTFs, subset, committed with their licence
  files.

## Risks

| Risk | Mitigation |
|---|---|
| react-pdf/Vite interop or client-only constraints surface late | First implementation step is a throwaway spike: one page, one custom font, page numbers, a link. Keep the spike out of the final code. |
| Bundle growth | Lazy module (already), measure the chunk, subset fonts. |
| No native repeating table header | Chunk the table explicitly with a header per chunk. |
| Node-side tests need canvas for QR | QR is computed in `ExportMenu` (browser) and passed in as an optional data URL. |
| Font licence/precache weight | OFL files committed; subset; added to the precache glob. |
| Logo/webicon arrive late or in an unsupported format | Renderer ships with a text fallback; prefer PNG @2x; validate SVG in the spike before depending on it. |

## Rollout

Replace the renderer directly; there is no flag or dual path. Keep the HTML
export untouched. Once parity is verified, remove `jspdf` and `jspdf-autotable`
from `package.json` (they are used only by the old renderer). Per project rule,
commit and push each completed change.
