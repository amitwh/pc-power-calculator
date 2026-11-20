# Distribution primitives — make the numbers findable, shareable and indexable

**Date:** 2026-11-20
**Status:** proposed (Project 2 of 4)
**Depends on:** trust core (idle baseline, monitor split) — numbers must be defensible before they are published at scale.

## Why

The app has 2,241 catalog parts, 18 country tariffs (34 Indian subdivisions) and 16
workloads, and exposes **7 URLs**. Every visitor is terminal: there is no share link,
no page to land on from a search, and nothing for a crawler to index beyond the app
shell. The calculator is good; there is no distribution.

## Success measure

- Google indexes part and tariff pages (GSC coverage: valid > 90% of submitted).
- Organic sessions grow from the current baseline, measured monthly in GSC.
- A build can be shared as one link and opened without loss.

## Approach: static prerender, not client-only rendering

The SPA serves an empty shell to crawlers that do not execute JS, and Google's
render budget will not reliably cover thousands of pages. Because **all data is
bundled at build time**, every route can be rendered to HTML during `vite build`
and hydrated on the client.

Rejected alternatives:
- *Client-only + sitemap* — cheapest, but leaves indexing to Google's render queue;
  thin or delayed coverage on exactly the pages meant to acquire traffic.
- *SSR server (Node/Cloudflare Workers)* — real runtime to operate and pay for; the
  data is static, so it buys nothing.

## Work items (in order, each shippable)

### 2a. Shareable build permalink
- **Wire format: reuse `?builds=<base64 json>`** — the format the HTML export already
  embeds and `/compare` already imports. One format, one sanitization path
  (`importBuild`), one set of tests. Do not add a second token scheme.
- Extract the decode/import logic out of `Compare.tsx` into `src/lib/share/buildLink.ts`
  and use it from both `/compare` and `/`, so a shared link works whichever page it
  lands on.
- Cap the encoded URL at 6 KB; beyond that, fall back to the JSON export with a
  visible message (no silent truncation).
- UI: "Share" in the Results header — `navigator.share` where available, clipboard
  copy otherwise, with visible confirmation.
- The query is stripped from the address bar after import so reloads do not
  re-import, but the shared URL keeps working for new visitors.
- Treat the token as untrusted: same validation path as file import, never a direct
  object merge.

### 2b. Build-time prerender
- Add an SSR entry (`src/entry-server.tsx`) exporting `render(url): { html, head }`.
- `scripts/prerender.mjs`: after `vite build`, run an SSR build, enumerate routes,
  `renderToString` each into `dist/<route>/index.html` with per-route
  `<title>`, description, canonical, OG tags and JSON-LD injected from a route
  manifest (not from `usePageMeta`, which is client-only).
- Client hydrates; `usePageMeta` stays for in-app navigation.
- nginx/`_headers` unchanged — `index.html` per directory is enough for the SPA fallback.
- Sitemap generated from the same manifest instead of the hand-edited
  `public/sitemap.xml`.

### 2c. Part pages `/parts/:id`
- One page per catalog part, all contents derived from real data:
  - headline (brand + model + category), rated TDP, modelled idle and load draw
  - cost to run at three patterns: 4 h/day (mixed use), 4 h/day gaming, 24/7 server
    — computed with the calculator's own engine at the visitor's resolved tariff
  - "what this part adds to a build" (its share of a representative build)
  - lower-power alternatives with perf retention, from `suggest.ts`
  - CTA: "open this build in the calculator" (seeds a permalink)
- **Publish in tranches, not all at once.** Start with parts whose `source` is
  `vendor-spec` (curated), then behaviourally popular parts from GSC, then the rest.
  Each tranche ships only if the previous one shows valid indexing.
- JSON-LD: `BreadcrumbList` + `FAQPage` on the 3–4 questions the page answers.

### 2d. Tariff pages `/cost/:country/:state`
- Per country and per Indian subdivision: slab table, taxes, `lastUpdated`, and a
  worked example (a 350 W mid-range build at 4 h/day) with the live engine.
- ~52 India + 18 country pages. These are the pages that answer "gaming PC
  electricity cost in Maharashtra" style queries with a real slab table.

### 2e. Content cluster (Project 3 boundary)
Six to ten guides targeting distinct query families, each linking down to the
relevant part and tariff pages. Do not start until 2c/2d are indexed.

## Non-goals

- Server-side rendering at request time, user accounts, saved builds in the cloud.
- Programmatically generating pages for combinations with no unique data
  ("RTX 4090 vs 4080 in Kerala" cross-products) — thin-content risk.

## Risks

| Risk | Mitigation |
|---|---|
| Google classifies part pages as thin/auto-generated | Real computed numbers + tranche rollout + GSC gate before scaling |
| Prerender build time grows with 2,241 pages | Render tranches; cache by route; concurrent worker pool |
| Permalink tokens become huge with full parts lists | Strip defaults, cap at 6 KB, fall back to JSON export |
| Duplicate content between `/` and `/parts/:id` CTA | Canonical + distinct titles/descriptions per route |
