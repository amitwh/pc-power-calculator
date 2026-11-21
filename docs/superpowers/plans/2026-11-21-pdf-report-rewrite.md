# PDF Report Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the manual jsPDF renderer with a flow-laid-out `@react-pdf/renderer` document that prints 2–3 dense A4 pages, never clips text, shows one reconciled yearly total, embeds the brand typeface, and carries a QR back to the build permalink.

**Architecture:** Extract the shared report model and formatters into `src/lib/export/report.ts`; build the new document as a pure component tree in `src/lib/export/pdfDocument.tsx` (testable in Node); keep the old renderer live until the final task, then switch `ExportMenu` to a dynamically imported `exportPdf` and delete the jsPDF code. Fonts are static OFL TTFs registered at export time; QR and logo assets are resolved in the browser and passed into the pure document.

**Tech Stack:** React 19, Vite 8, TypeScript 7, Tailwind 4 (unaffected), `@react-pdf/renderer` 4.9.0, `qrcode` 1.5.4, Vitest 5 (node environment for render tests), Playwright, poppler-utils (`pdftotext`, `pdftoppm`) for text/visual verification.

**Spec:** `docs/superpowers/specs/2026-11-21-pdf-report-rewrite-design.md`

## Global Constraints

- A4 (595.28 × 841.89 pt), 36 pt page margins.
- Body text 9.5–10.5 pt; hero 34 pt; brand `#e5461f`, brand-dark `#c93a18`.
- Every amount: `₹` with en-IN grouping (`₹1,00,000.00`); dates `DD Mon YYYY` in IST (`Asia/Kolkata`).
- Typical report: 2–3 pages, no page more than 30 % blank.
- No clipped text anywhere — metadata, table cells, footer disclaimer.
- One yearly total on the page; the hero and the schedule sentence print the same value.
- Embedded Inter (Regular/SemiBold/Bold) and JetBrains Mono Regular; `₹`, `CO₂e`, `×`, `—`, `≈` must render.
- Renderer is lazy: it must not enter the main bundle; lazy chunk ≤ ~500 KB gzip.
- PWA precache gains `ttf`; export works offline once installed.
- No change to the calculation engine, catalog, tariffs, URLs, or HTML report layout.
- Dependencies: `@react-pdf/renderer@4.9.0`, `qrcode@1.5.4` (verified 2026-11-21, OSV clean); re-verify before install.
- Every task ends with `npm test` green, `npm run typecheck` clean, and a commit **and push** to `main` (project rule).
- Every commit message ends with the line `Amit Haridas`.

## Review Focus

1. **A build with zero components** — the report must render zero amounts and empty states, never `NaN` or a crash. Test in Task 3.
2. **A 30+ component build** — the components table must chunk across pages with a repeated header, no clipped names or numbers. Test in Task 5.
3. **A share token over the 6 KB cap** — no QR, no broken image, no empty caption; the site link remains. Test in Task 6.
4. **A build missing the PSU, meter readings, or catalog date** — "Not selected", "—", and the measured empty-state line, with no `undefined` text. Test in Task 5.
5. **An amount above ₹1,00,000 with paise** — lakh grouping and a real `₹` in the PDF text layer. Test in Tasks 2 and 4.

---

### Task 1: Spike — prove react-pdf in this Vite app (throwaway)

**Files:**
- Create (throwaway): `spike/pdf.html`, `spike/pdf.tsx`
- Modify: `package.json`, `package-lock.json` (dependency install)

**Interfaces:**
- Consumes: nothing.
- Produces: a go/no-go answer on Vite interop, page numbers, fixed footers, links, and a data-URL image. No production code.

- [ ] **Step 1: Install the two dependencies**

```bash
npm install @react-pdf/renderer@4.9.0 qrcode@1.5.4
npm install -D @types/qrcode
```

- [ ] **Step 2: Create the spike page**

`spike/pdf.html` loads `/spike/pdf.tsx`. The component renders a two-page `Document` with: page 1 containing a long `View wrap={false}` that pushes a second block to page 2; a `fixed` footer with `Page X of Y` via `Text render={({pageNumber,totalPages}) => ...}`; a `Link` to `https://pcpower.concreteinfo.co.in`; and an `Image` whose `src` is `QRCode.toDataURL('https://example.com')` generated in the click handler. A button calls `pdf(<Spike/>).toBlob()` and downloads the result.

- [ ] **Step 3: Run the spike in the browser**

Run: `npm run dev`, open `http://localhost:5173/spike/pdf.html`, click Generate.
Expected: a PDF downloads with exactly 2 pages, the footer shows `Page 1 of 2` and `Page 2 of 2`, the link is clickable, the QR is visible and scannable.

- [ ] **Step 4: Prove the production build accepts it**

Run: `npm run build`
Expected: exit 0, no Node-polyfill or `process is not defined` error.

- [ ] **Step 5: Delete the spike and record findings**

```bash
rm -rf spike
```

Do **not** commit the spike. Note in the task report: whether `Image` accepted the QR data URL, whether SVG images worked (informational for the logo), and the observed chunk size of react-pdf in the build output.

---

### Task 2: Shared report module and total reconciliation

**Files:**
- Create: `src/lib/export/report.ts`
- Modify: `src/lib/export/pdf.ts` (import from `./report`; delete moved code)
- Modify: `src/lib/export/html.ts` (import from `./report`; use the reconciled total)
- Test: `tests/unit/export/report.test.ts`
- Delete: `tests/unit/export/pdf.test.ts` (its surviving cases fold into `report.test.ts`; the `pdfText` cases are removed)

**Interfaces:**
- Consumes: `formatCost` from `@/lib/calc/format`; `labelFor` and `CATEGORY_LABEL` from `@/lib/buildCategory`.
- Produces:
  - `PdfReport`, `PdfDeviceRow`, `PdfScheduleRow`, `PdfPsuInfo`, `PowerBasis` (moved unchanged)
  - `REPORT_DISCLAIMER`, `CATEGORY_LABEL` (component categories), `BASIS_LABEL`, `DEFAULT_GRID_FACTOR_KG_PER_KWH` (moved unchanged)
  - `money(amount: number, currency: CurrencyInfo): string` — returns `formatCost` output including `₹`
  - `num(n: number, decimals?: number): string`, `kwh(kwh: number, decimals?: number): string`
  - `pdfNum`/`pdfKwh` — aliases kept so existing imports compile
  - `sumRounded(values: number[], decimals?: number): number`
  - `roundMoney2(n: number): number`
  - `reconciledTotals(report: PdfReport): { rows: number[]; yearly: number }` — `rows[i]` aligns with `report.schedule[i]`; `yearly` is the sum of `rows`
  - `basisFor`, `certificationLabel`, `reportFileName`, `istTimestamp`, `makeReportId` (moved unchanged)
  - `buildCategoryLabel(category?: string): string` — `'gaming'` → `'Gaming PC'`; unknown → the raw string
  - `deviceCategoryLabel(row: PdfDeviceRow): string` — `"Generic Case fans ×N"` → `'Case fan'`; otherwise `CATEGORY_LABEL[row.category] ?? row.category`
- `pdfText` and the WinAnsi-safe `pdfMoney` are **not** moved: the old jsPDF
  renderer keeps them as private functions until Task 7 deletes it. The shared
  `money()` returns a real `₹`, which jsPDF's Helvetica cannot print.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/export/report.test.ts`:

```ts
test('money prints the rupee glyph and lakh grouping', () => {
  expect(money(123456.5, findCurrency('INR')!)).toBe('₹1,23,456.50');
});
test('reconciledTotals rows sum to the printed yearly total', () => {
  const r = reconciledTotals(reportWithCosts([4454.13, 3581.41, 1996.05, 381.55]));
  expect(r.rows).toEqual([4454.13, 3581.41, 1996.05, 381.55]);
  expect(r.yearly).toBe(10413.14);
});
test('buildCategoryLabel maps the id to the display term', () => {
  expect(buildCategoryLabel('gaming')).toBe('Gaming PC');
});
test('deviceCategoryLabel names the synthetic fan row', () => {
  expect(deviceCategoryLabel({ ...fanRow, name: 'Generic Case fans ×2' })).toBe('Case fan');
});
```

Move the surviving formatting cases from `tests/unit/export/pdf.test.ts` into
`report.test.ts` (importing from `./report`), delete the old file, and drop the
`pdfText` cases. The `pdfMoney` case now asserts `₹1,234.50`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/export/report.test.ts`
Expected: FAIL — `report.ts` does not exist.

- [ ] **Step 3: Create `report.ts` and move the helpers**

Move the types, constants and helpers listed in Interfaces verbatim, with these changes: `money` is `formatCost` with no glyph stripping; `roundMoney2` is `Math.round(n * 100) / 100`; `reconciledTotals` rounds each `costYear` with `roundMoney2`, sums those, and rounds the sum; `buildCategoryLabel` uses `labelFor` for valid ids; `deviceCategoryLabel` checks the `"Generic Case fans"` prefix.

- [ ] **Step 4: Update the two existing consumers**

`src/lib/export/pdf.ts` imports the moved names from `./report` and re-exports
them for compatibility; it keeps private `pdfText`/`pdfMoney` helpers, and its
hero amount and "The schedule totals …" sentence both use
`reconciledTotals(report).yearly` so the live renderer is consistent until Task
7. `src/lib/export/html.ts` imports from `./report`, and both its hero amount and
its "The schedule totals …" sentence use `reconciledTotals(report).yearly`.

- [ ] **Step 5: Run the tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all 347+ tests pass; typecheck clean. If `html.test.ts` asserts a schedule total that changes by rounding, update the expected value and note it.

- [ ] **Step 6: Commit and push**

```bash
git add src/lib/export/report.ts src/lib/export/pdf.ts src/lib/export/html.ts tests/unit/export/report.test.ts tests/unit/export/pdf.test.ts
git commit -m "refactor(export): extract the shared report model and reconcile totals"
git push origin main
```

---

### Task 3: New document — cover, hero, bars, method, idle block

**Files:**
- Create: `src/lib/export/pdfDocument.tsx`
- Test: `tests/unit/export/pdfDocument.test.tsx`
- Modify: `package.json` only if Task 1's install was reverted

**Interfaces:**
- Consumes: everything from `report.ts`; `categoryColor` from `@/lib/categoryColors`; `CONSUMPTION_TIERS`, `averageWallW`, `tierFor`, `tierPosition` from `@/lib/calc/classify`.
- Produces:
  - `ReportDocument(props: { report: PdfReport; qrDataUrl?: string; shareUrl?: string | null; logoDataUrl?: string | null }): JSX.Element`
  - `exportPdf(report: PdfReport, opts?: ExportPdfOptions): Promise<void>` — browser-only; calls `registerReportFonts('/fonts/report')` (added in Task 4), `pdf(<ReportDocument …/>).toBlob()`, then downloads `reportFileName(report, 'pdf')`
  - `ExportPdfOptions = { qrDataUrl?: string; shareUrl?: string | null; logoDataUrl?: string | null }`
- The module is **not** imported by the app yet.

- [ ] **Step 1: Write the failing render test**

`tests/unit/export/pdfDocument.test.tsx`, first line `// @vitest-environment node`:

```tsx
import { renderToBuffer } from '@react-pdf/renderer';
import { ReportDocument } from '@/lib/export/pdfDocument';

test('renders a PDF from a zero-component build without NaN or a crash', async () => {
  const buf = await renderToBuffer(<ReportDocument report={emptyReport} />);
  expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(5_000);
});
test('renders a normal build', async () => {
  const buf = await renderToBuffer(<ReportDocument report={gamingReport} />);
  expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(10_000);
});
```

Use a local fixture module `tests/unit/export/fixtures.ts` exporting `emptyReport` and `gamingReport` (the seven-part build from the review: 4+8+4 h schedule, 2 h idle, measured readings).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/export/pdfDocument.test.tsx`
Expected: FAIL — cannot resolve `pdfDocument`.

- [ ] **Step 3: Implement the document shell and the first five sections**

One `<Page size="A4" style={{ padding: 36 }}>`; a `fixed` footer (product line, `Page X of Y` via `Text render`, report ID · IST date, one-line short disclaimer); a `fixed` continuation header whose text is empty on page 1 (`render={({ pageNumber }) => pageNumber > 1 ? … : ''}`).

Sections: brand bar + build name + `buildCategoryLabel(report.buildCategory)` + location/tariff; wrapped metadata grid; hero (yearly from `reconciledTotals`, monthly/day from `report.totals`); power-by-category bars (Views, percentage widths); cost-by-use-case bars (rows paired with `reconciledTotals().rows`, schedule sentence printing `yearly`); numbered method steps; idle/typical/max rows. Every section is `<View wrap={false}>`. Zero devices → the existing "No components selected." line; zero schedule → omit the use-case section.

Use Helvetica for now; Task 4 swaps the font.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/export/pdfDocument.test.tsx && npm run typecheck`
Expected: PASS for both reports.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/export/pdfDocument.tsx tests/unit/export/pdfDocument.test.tsx tests/unit/export/fixtures.ts
git commit -m "feat(export): add the flow-laid-out react-pdf document core"
git push origin main
```

---

### Task 4: Embedded brand fonts and glyph correctness

**Files:**
- Create: `public/fonts/report/Inter-Regular.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf`, `JetBrainsMono-Regular.ttf`, `OFL-Inter.txt`, `OFL-JetBrainsMono.txt`
- Create: `src/lib/export/reportFonts.ts`
- Modify: `src/lib/export/pdfDocument.tsx`, `vite.config.ts`
- Test: `tests/unit/export/pdfDocument.test.tsx` (extend)

**Interfaces:**
- Produces:
  - `registerReportFonts(base: string): void` — calls `Font.register` for family `'Inter'` (400/600/700) and `'JetBrains Mono'` (400) with `${base}/<file>.ttf`
  - `REPORT_FONT_FAMILIES = { body: 'Inter', numeric: 'JetBrains Mono' }`
- `ReportDocument` styles use `REPORT_FONT_FAMILIES.body` / `.numeric`.

- [ ] **Step 1: Fetch and subset the fonts**

Download the upstream OFL releases (Inter release zip, JetBrains Mono release zip). Subset each with fonttools:

```bash
python3 -m fontTools.subset Inter-Regular.ttf --output-file=public/fonts/report/Inter-Regular.ttf \
  --unicodes="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+20B9,U+2082,U+00B7,U+00D7,U+2248,U+00B3" \
  --layout-features='*' --glyph-names --notdef-outline
```

Repeat for SemiBold, Bold, and JetBrainsMono-Regular. Copy the upstream OFL licence files beside them. Expected: each file 30–60 KB. If the subsetting tool is unavailable, commit the full static TTFs instead (larger precache, same rendering) and note it.

- [ ] **Step 2: Extend the render test with a text-layer check**

Add to `pdfDocument.test.tsx`: render a `lakhReport` fixture whose **schedule rows sum to 123,456.50** (the hero uses the reconciled row sum, not `totals.yearly.cost`), write the buffer to `tests/tmp/report.pdf`, then run `pdftotext -layout` with `execFileSync`. Skip when the binary is missing.

```ts
expect(text).toContain('₹1,23,456.50');
expect(text).not.toContain('Rs.');
```

`CO₂e` is asserted in Task 5, once the carbon/equivalence sections exist.

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- tests/unit/export/pdfDocument.test.tsx`
Expected: FAIL — `Rs.` still present / `₹` missing.

- [ ] **Step 4: Register fonts and switch the document styles**

Implement `reportFonts.ts`; call `registerReportFonts` from the test with an absolute `public/fonts/report` base and from `exportPdf` with `/fonts/report`. Replace `fontFamily: 'Helvetica'` with the families; set figures (amounts, watts, kWh, table numerics) to `numeric`. Add `ttf` to `globPatterns` in `vite.config.ts`.

- [ ] **Step 5: Run tests, typecheck and build**

Run: `npm test && npm run typecheck && npm run build`
Expected: green; the build copies the fonts into `dist/fonts/report/`.

- [ ] **Step 6: Commit and push**

```bash
git add public/fonts/report src/lib/export/reportFonts.ts src/lib/export/pdfDocument.tsx vite.config.ts tests/unit/export/pdfDocument.test.tsx
git commit -m "feat(export): embed Inter and JetBrains Mono in the report"
git push origin main
```

---

### Task 5: Remaining sections and table chunking

**Files:**
- Modify: `src/lib/export/pdfDocument.tsx`
- Test: `tests/unit/export/pdfDocument.test.tsx` (extend)
- Test fixture: `tests/unit/export/fixtures.ts`

**Interfaces:**
- Consumes: `basisFor`, `certificationLabel`, `deviceCategoryLabel`, `CATEGORY_LABEL`, `BASIS_LABEL`, `equivalences`, `tierFor`, `tierPosition`, `averageWallW`.
- Produces: sections for components (chunked), power supply, carbon, what-this-means, measured-vs-model, full disclaimer. No new exported functions.

- [ ] **Step 1: Write the failing tests**

Add to `pdfDocument.test.tsx`:

```ts
test('a 30-component table repeats its header on each chunk', async () => {
  const text = await renderAndExtract(bigReport(30));
  expect(text.match(/Device\s+Category\s+Qty/g)?.length ?? 0).toBeGreaterThan(1);
});
test('missing PSU and readings render dashes, not undefined', async () => {
  const text = await renderAndExtract(reportWithoutPsuAndMeasured);
  expect(text).toContain('Not selected');
  expect(text).not.toContain('undefined');
  expect(text).toContain('No meter readings were entered');
});
test('carbon and equivalence text keeps the subscript and rupee glyph', async () => {
  const text = await renderAndExtract(gamingReport);
  expect(text).toContain('CO₂e');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- tests/unit/export/pdfDocument.test.tsx`
Expected: FAIL — sections do not exist yet.

- [ ] **Step 3: Implement the sections**

Components table: rows from `report.devices` excluding PSU; chunk 18 rows per `<View wrap={false}>`, each chunk rendering the header row (`Device / Category / Qty / W per unit / Total W / Basis`); category via `deviceCategoryLabel`; basis colour (estimated amber, measured green); foot row with `report.typicalComponentW`.

Power supply: rows and recommendation paragraph, undersized warning, all values via `num`. Carbon: annual energy, grid factor, emissions, five-year equivalent. What this means: consumption-band gauge over every `CONSUMPTION_TIERS` entry (six today — follow the data, not a fixed count), band line, suggestion, equivalence rows (same selection logic as the old renderer: one carbon, three fuel, one water, one everyday). Measured vs model: rows with delta colouring and the empty-state sentence. Closing full `REPORT_DISCLAIMER`.

- [ ] **Step 4: Run tests, typecheck, and inspect the pages**

Run: `npm test && npm run typecheck && npm run build`
Then render the test PDF to images and inspect: `pdftoppm -r 110 -png tests/tmp/report.pdf /tmp/report-page`.
Expected: 2–3 pages, no blank page, no clipped cell or footer line.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/export/pdfDocument.tsx tests/unit/export/pdfDocument.test.tsx tests/unit/export/fixtures.ts
git commit -m "feat(export): complete the report sections and table pagination"
git push origin main
```

---

### Task 6: QR permalink, running header, and logo fallback

**Files:**
- Create: `src/lib/export/brandAssets.ts` (browser helpers; must NOT import react-pdf)
- Create: `public/brand/logo-report.png` (downscaled for print; keeps the PDF small)
- Modify: `src/lib/export/pdfDocument.tsx`
- Test: `tests/unit/export/pdfDocument.test.tsx` (extend)

**Interfaces:**
- Produces:
  - `ReportDocument` accepts `qrDataUrl`, `shareUrl`, `logoDataUrl`, `iconDataUrl` (Task 3 signature extended)
  - `loadBrandLogo(): Promise<string | null>` — in `brandAssets.ts`; fetches `/brand/logo-report.png` (then `/brand/logo.png`), returns a data URL or null
  - `loadBrandIcon(): Promise<string | null>` — fetches `/icons/pwa-192x192.png`, returns a data URL or null
  - `makeQrDataUrl(url: string): Promise<string>` — browser-only, dynamic `import('qrcode')`, `toDataURL(url, { margin: 1, width: 512 })`

- [ ] **Step 1: Write the failing tests**

```ts
test('draws the QR caption and share link when a URL is supplied', async () => {
  const text = await renderAndExtract(gamingReport, { shareUrl: 'https://pcpower.concreteinfo.co.in/build/abc', qrDataUrl: TINY_PNG });
  expect(text).toContain('Scan to open this build');
  expect(text).toContain('https://pcpower.concreteinfo.co.in/build/abc');
});
test('omits the QR block when no URL is supplied', async () => {
  const text = await renderAndExtract(gamingReport, { shareUrl: null });
  expect(text).not.toContain('Scan to open this build');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test -- tests/unit/export/pdfDocument.test.tsx`
Expected: FAIL — no caption.

- [ ] **Step 3: Implement QR block, running header, and logo**

The supplied assets are already committed at `public/brand/logo.png` (2167 × 726,
navy wordmark) and `public/icons/pwa-192x192.png` (square appicon). Cover: when
`logoDataUrl` is present render `<Image src={logoDataUrl} style={{ height: 20 }} />`
inside a white rounded plate on the left of the orange brand bar (the logo's navy
wordmark cannot sit directly on orange); otherwise the text wordmark. When
`shareUrl` is present, place the QR (72 × 72 pt) with the caption and the URL in
small type as a closing block on the last page (the cover is full). Continuation header: the square appicon on a
small white plate + `buildName · reportId`.

Create `brandAssets.ts` with the three browser helpers. `ExportMenu` imports it statically (it must not import react-pdf, or the renderer enters the main bundle); `makeQrDataUrl(buildPermalinkUrl(useBuildStore.getState().exportBuild()))`, `loadBrandLogo()` and `loadBrandIcon()` are wired into `onPdf` in Task 7.

- [ ] **Step 4: Run tests, typecheck, build, inspect**

Run: `npm test && npm run typecheck && npm run build`
Render and inspect the PDF: the QR is present and scannable, the caption and URL are readable, no image overflow, the continuation header appears only on page 2+.

- [ ] **Step 5: Commit and push**

```bash
git add src/lib/export/pdfDocument.tsx src/components/calculator/ExportMenu.tsx tests/unit/export/pdfDocument.test.tsx
git commit -m "feat(export): add the QR permalink, running header and logo fallback"
git push origin main
```

---

### Task 7: Switch the app to the new renderer and remove jsPDF

**Files:**
- Rename: `src/lib/export/pdfDocument.tsx` → `src/lib/export/pdf.tsx`
- Delete: `src/lib/export/pdf.ts` (old renderer)
- Modify: `src/components/calculator/ExportMenu.tsx`, `src/lib/export/index.ts`, `package.json`
- Modify: `tests/unit/export/pdfDocument.test.tsx` (import path becomes `@/lib/export/pdf`)
- Test: `tests/e2e/pdf.spec.ts` (new)

**Interfaces:**
- Consumes: `exportPdf`, `makeQrDataUrl`, `loadBrandLogo` from `@/lib/export/pdf`.
- Produces: the production export path. `index.ts` exports `report` and `html` only.

- [ ] **Step 1: Write the failing e2e test**

`tests/e2e/pdf.spec.ts`: seed `pc-power-builds` with the gaming fixture (same shape as the unit fixture), load `/`, click `button[aria-label="Export PDF"]`, capture the download, save it, and run `pdftotext -layout` (skip when missing). Assert:

```ts
expect(text).toContain('Page 1 of');
expect(text).toContain('₹10,436.26');            // the seeded build's computed total
expect(text).toContain('The schedule totals ₹10,436.26');
expect(text).toContain('Gaming PC');
expect(text).toContain('Case fan');
expect(text).toContain('CO₂e');
expect(text).toContain('Scan to open this build');
expect(text).toContain('/build/…');               // shortened caption
expect(text).toMatch(/Gaming build · PCP-/);      // continuation header
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run build && npx playwright test tests/e2e/pdf.spec.ts`
Expected: FAIL — the old renderer prints `Rs.` and has no QR.

- [ ] **Step 3: Switch the wiring**

In `ExportMenu.onPdf`: `const { exportPdf, makeQrDataUrl, loadBrandLogo } = await import('@/lib/export/pdf')`; compute `shareUrl`, `qrDataUrl`, `logoDataUrl`; call `exportPdf(makeReport(), { shareUrl, qrDataUrl, logoDataUrl })`. Update `index.ts` to `export * from './report'; export * from './html';`. `git mv src/lib/export/pdfDocument.tsx src/lib/export/pdf.tsx`; delete the old `pdf.ts`; update the unit test's import to `@/lib/export/pdf`.

- [ ] **Step 4: Run the e2e test to verify it passes**

Run: `npm run build && npx playwright test tests/e2e/pdf.spec.ts`
Expected: PASS.

- [ ] **Step 5: Remove jsPDF and verify the lazy boundary**

```bash
npm uninstall jspdf jspdf-autotable
grep -rn "jspdf\|pdfText" src tests || echo "no jsPDF references"
npm run build
ls -S dist/assets/*.js | head -3
```

Expected: no references; the build succeeds; react-pdf lives in its own lazy chunk, not the entry chunk. Record the chunk's gzip size (`gzip -c <chunk> | wc -c`).

- [ ] **Step 6: Full verification**

```bash
npm run typecheck && npm test && npm run build && npx playwright test tests/e2e/a11y.spec.ts tests/e2e/pdf.spec.ts
```

Expected: typecheck clean, 347+ unit/component tests pass, 386 routes prerendered, a11y 8/8, PDF e2e pass. Render the exported PDF to PNG and inspect the final pages.

- [ ] **Step 7: Commit and push**

```bash
git add -A src/lib/export src/components/calculator/ExportMenu.tsx tests/e2e/pdf.spec.ts tests/unit/export/pdfDocument.test.tsx package.json package-lock.json
git commit -m "feat(export): ship the react-pdf report and retire jsPDF"
git push origin main
```

---

## Self-Review Notes

- Spec coverage: every spec section maps to a task — module split (2), flow document (3, 5), fonts (4), QR/header/logo (6), lazy boundary (7), totals (2), labels (2, 5), testing (2–7), brand assets (6).
- Task 2 keeps the old renderer compiling by leaving its private `pdfText`/`pdfMoney` in place; Task 7 removes the whole module.
- The new renderer is never in the app bundle until Task 7, so each intermediate push keeps the live PDF unchanged.
- `ReportDocument` stays pure (no fetch, no fonts registration) so Node tests can render it; browser I/O lives in `exportPdf` and `ExportMenu`.

## Post-implementation notes (2026-11-21)

Delivered as planned, with these implementation facts worth keeping:

- **CSP:** react-pdf required `'wasm-unsafe-eval'` (Yoga WASM), `font-src data:`,
  `connect-src data:` and `worker-src blob:` in the meta tag, nginx and
  `_headers`. No `'unsafe-eval'`; the GTM inline hash is unchanged.
- **Fixed elements:** a fixed View containing both an image and text drops the
  text. Fixed text (`<Text fixed render=…>`) and fixed images are separate
  elements in the continuation header.
- **QR caption:** prints a shortened URL; the QR carries the full build token.
  This keeps the report at three pages.
- **e2e total:** the seeded build computes ₹10,436.26 (India default tariff),
  not the synthetic ₹10,413.14 used in the unit fixtures. The e2e asserts the
  real computed value and pins `pc-power-geo-detected` so IP geolocation cannot
  rewrite the tariff mid-test.
- **Gauge:** iterates every `CONSUMPTION_TIERS` band (six today).
- **Bundle:** react-pdf is a lazy chunk (~437 KB gzip); the entry stays ~154 KB.
- **Five-year carbon:** corrected to `annual × 5 / 1000` in both legacy
  renderers as well.
