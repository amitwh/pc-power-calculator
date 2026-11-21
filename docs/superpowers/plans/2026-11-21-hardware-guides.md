# Plan — Hardware guides expansion + per-page SEO meta

**Date:** 21 November 2026
**Goal:** Turn the guides section into a complete PC-hardware reference (every major
component explained, with diagrams), and guarantee that every page — including the
new guides — carries a unique title, description, keywords, canonical, Open Graph,
Twitter card, GA/GTM tags, and a sitemap entry.

## Decisions taken (with the user)

1. **Illustrations** — hand-authored inline SVG only, in the brand palette. No
   external images: the app's CSP (`img-src 'self' data: …`) blocks third-party
   image hosts, hotlinking raises licensing questions, and inline SVG matches the
   existing `src/components/guides/Figures.tsx` pattern (crisp, printable, offline,
   zero extra requests).
2. **"Search tags"** — per-page SEO meta tags (title, description, keywords,
   canonical, OG, Twitter), applied at prerender *and* on client-side navigation,
   plus verified sitemap + GA tags on every page. Not an on-site search box.

## Content model

The guide content moves out of the page component into its own module, because the
guide set roughly triples and one 3,000-line `Guides.tsx` is not maintainable.

```
src/content/guides/
  types.ts        Guide, GuideCategory
  index.ts        imports every guide, exports GUIDES + GUIDE_CATEGORIES
  <slug>.tsx      one file per guide
```

`src/pages/Guides.tsx` keeps the page shell and re-exports `GUIDES`, so
`entry-server.tsx`, `TopNav.tsx`, `usePageMeta.ts` and the existing tests keep
working without import churn.

`Guide` gains two fields:

| Field | Purpose |
|---|---|
| `category` | groups the hub into sections (Power, Hardware, Billing) |
| `tags` | free keywords — drives the hub filter and the page's `keywords` meta |

## Guide set (26: 9 existing + 17 new)

**Power & electricity (10)**
`gaming-pc-power` · `psu-sizing` · `psu-efficiency` *(new)* ·
`power-factor-correction` *(new)* · `psu-connectors` *(new)* ·
`wall-power-vs-component-power` · `what-each-component-draws` ·
`cutting-pc-power` · `local-ai-power` · `running-pc-24-7`

**Hardware deep-dives (13)**
`how-a-pc-works` *(new)* · `cpu-explained` *(new)* · `cpu-caches` *(new)* ·
`fpu-explained` *(new)* · `npu-explained` *(new)* · `gpu-explained` *(new)* ·
`igpu-vs-dgpu` *(new)* · `vram-explained` *(new)* · `ram-explained` *(new)* ·
`storage-explained` *(new)* · `pcie-and-m2` *(new)* ·
`motherboard-explained` *(new)* · `cooling-explained` *(new)*

**Billing (2)**
`india-tariff` · `how-electricity-tariffs-work`

Plus `hardware-glossary` *(new)* — the acronym table, covering the terms the
brief called out (FPU, NPU, IU, cache, PCIe) and the site's own vocabulary.

## Figures

Existing three stay. New ones live in
`src/components/guides/figures/{Power,Compute,Bus}Figures.tsx`, re-exported from
`src/components/guides/Figures.tsx` so the old import path keeps working.

New: PSU efficiency curve vs 80 PLUS bands · power-factor vector triangle ·
PSU connector/rail map · CPU die block diagram · cache hierarchy pyramid ·
CPU/GPU/NPU block comparison · GPU pipeline · VRAM bandwidth · PCIe lane
bandwidth · RAM channels · storage speed · motherboard layout ·
air-vs-AIO cooling.

Conventions (match `Figures.tsx`): `viewBox` fitted to the drawing, 10-unit grid,
`role="img"` + `aria-label`, `currentColor` for ink so light/dark mode both work,
brand `#e5461f` for emphasis, `fontFamily="inherit"`, `<figcaption>` under every
figure, grouped layers.

## SEO

1. **New `src/lib/seo/routeMeta.ts`** — one resolver that returns
   `{ title, description, keywords, ogType }` for any path, or `null` for a
   path that does not exist. Used by *both* the prerenderer and the client hook,
   so a prerendered page and a client-side navigation always agree.
2. **`src/hooks/usePageMeta.ts`** — extended from title + canonical to the full
   set: description, keywords, `og:title`/`og:description`/`og:url`/`og:type`,
   `twitter:title`/`twitter:description`/`twitter:card`, canonical, and
   `noindex` for unknown paths (which also strips the stale tags).
3. **`scripts/prerender.mjs`** — injects the per-page `keywords` and Twitter tags
   alongside the existing title/description/canonical/OG/JSON-LD.
4. **`scripts/verify-seo.mjs`** — audits `dist/`: every prerendered page has
   title, description, keywords, canonical, OG and Twitter tags plus the GA/GTM
   snippets; `sitemap.xml` covers every route; no page shares a description with
   another. Wired into `npm run build` and `npm test`.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`
- `npm run build` → prerenders 25 guides + part/tariff pages, writes the sitemap
- `node scripts/verify-seo.mjs` → every page passes
- Playwright a11y run over the new guide routes (axe: SVG needs a role + label,
  contrast of brand-on-white text)
