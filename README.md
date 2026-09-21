# PC Power Calculator

> A global, open-source calculator for estimating the **power consumption** and **electricity cost** of a personal computer — in any local currency.

🌐 **Live:** https://pcpower.concreteinfo.co.in
📐 **Design spec:** [`docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md`](./docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md)

Pick your components, set the workload, and see how much power your PC draws and what it costs to run. Compare configurations side by side and get suggestions on power-vs-performance trade-offs.

**Status:** 🛠️ *Spec approved — implementation starts at M0 (skeleton deploy).* See the [release milestones](./docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md#11-release-milestones) in the design doc.

---

## ✨ Features (planned for v1)

- 🧩 **Component selection** — CPU, GPU, RAM, storage, **motherboard**, PSU, monitors, coolers, add-in cards, optical, UPS, peripherals.
- ⚡ **Power calculation** — sum of component TDPs adjusted by per-workload utilization, with proper PSU efficiency curves and idle/active distinctions.
- 🌍 **Localised cost** — country- and state/province-aware electricity tariff (including tiered slab tariffs for India and similar markets); result in local currency with manual override.
- ⏱️ **Time horizon** — daily, monthly, yearly cost projections from a workload schedule.
- 🔄 **Compare builds** — side-by-side 2–N builds with workload-specific performance and cost.
- 💡 **Suggestions** — rule-based lower-power alternatives with ≥90 % perf retention.
- 📤 **Export** — PDF (browser print) and self-contained HTML (re-importable).
- 📱 **PWA, mobile-first, offline-capable** — installable to home screen, works on flaky networks.

**Workloads covered:** gaming (1080p / 1440p / 4K), content creation (Blender, Premiere, Lightroom), productivity + dev (office, compile, browser), AI/ML + mining, server (home server / NAS / always-on).

---

## 🧱 Tech stack (locked)

| Layer | Choice |
|-------|--------|
| Build tool | Vite 5 |
| Framework | React 18 + TypeScript 5 |
| UI library | ConcreteInfo design system (Plus Jakarta Sans body, Inter display + numeric, SF Mono / Fira Code mono) |
| Charts | ApexCharts |
| Data tables | TanStack Table v8 |
| State | Zustand |
| Forms | React Hook Form + Zod |
| PWA | `vite-plugin-pwa` (Workbox) |
| Tests | Vitest + React Testing Library + `fast-check` + Playwright + `@axe-core/playwright` |

**Deployment:** Coolify (ConcreteInfo) behind Cloudflare CDN. Live URL: https://pcpower.concreteinfo.co.in

---

## 📦 Data sources

- **Component TDPs / specs:** curated JSON bundled with the app, covering ~300 popular parts across 12 categories. Last-updated date shown in the UI.
- **Electricity tariffs:** bundled JSON for major countries (India all states, US all states, UK, EU, +10 popular), with a free public API fallback when a user's country isn't bundled.
- **FX rates:** bundled snapshot + daily refresh from a free public API.
- **Geolocation:** free public IP geolocation, with manual country + subdivision selector as fallback.
- **Manual override:** the user can always type their own rate, currency, and subdivision — their actual bill is the ground truth.

Numbers use `toLocaleString('en-IN')` formatting (`1,00,000`) and `Intl.NumberFormat` for per-currency display.

---

## 🚀 Getting started

```bash
# install dependencies
npm install

# run dev server
npm run dev

# run tests
npm test                  # vitest unit + component
npm run test:e2e          # playwright e2e (calculator + 5 routes)
npm run test:a11y         # axe-core a11y scan of all routes
npm run lighthouse        # lighthouse CI (perf >= 0.9, a11y >= 0.95, PWA >= 0.9)

# build for production
npm run build

# preview production build
npm run preview
```

Open http://localhost:5173 (dev) or http://localhost:4173 (preview) in your browser.

---

### CI thresholds (Lighthouse)

The CI workflow runs `lhci autorun` against a local `npm run preview` server. The assertion thresholds in `.lighthouserc.json` are tuned for that constrained environment:

| Category        | CI-local minScore | Production target (design spec §9.1) | Why |
|-----------------|-------------------|---------------------------------------|-----|
| Accessibility   | **0.95**          | 0.95                                  | Strict — enforced on every PR. |
| Performance     | **0.6**           | 0.9                                   | CI headless Chrome runs under Lighthouse's "Slow 4G + 4x CPU throttling" which materially underestimates the real Cloudflare-served score. 0.6 is a smoke floor that catches regressions (oversized bundles, leaked images, blocking JS) without blocking on noise. |
| PWA             | (not asserted)    | 0.9                                   | Lighthouse's PWA category audits require HTTPS; they don't run against `http://localhost`. Verify PWA score against the deployed URL with PageSpeed Insights or `npx lighthouse https://pcpower.concreteinfo.co.in --only-categories=pwa`. |

If you raise the production performance target, also bump the CI smoke floor in `.lighthouserc.json`.

---

## 🚢 Deployment (Coolify + Cloudflare)

The app is deployed to the **ConcreteInfo Coolify** instance (`coolify-hs`) behind **Cloudflare**, serving https://pcpower.concreteinfo.co.in.

The build is a pure static SPA — no server-side runtime, just `dist/` served by the Coolify-built Nginx image. Because the app uses **hash-based routing** (`HashRouter`), every deep link (`/#/compare`, `/#/suggestions`, etc.) works on any static host with no rewrite rules.

### Auto-deploy on push to `main`

1. Coolify has a GitHub webhook configured on `main` for this repo.
2. On every push to `main`, Coolify pulls the commit, runs the build (`npm ci && npm run build`), and rolls the new `dist/` out to the live container. Health check (`/`) must respond 200 within the timeout or the deploy rolls back.
3. Cloudflare caches and serves the static assets at the edge. No origin pull happens for cache hits.

> No GitHub Actions deploy job is required — Coolify does the build + deploy itself. The CI workflow at `.github/workflows/ci.yml` only validates (typecheck, unit, a11y, Lighthouse, build) on PRs and `main`.

### Manual redeploy (current commit)

If a webhook is missed (e.g. you rebased after pushing, or `main` is ahead of the deployed commit):

1. In Coolify UI, open the `pc-power-calculator` application.
2. Click **Redeploy** with the current `main` tip. Coolify re-runs the build and rolls the new container.

### Verifying a deploy

```bash
# status + last deployment
curl -fsSL https://pcpower.concreteinfo.co.in/ | head -c 200
# lighthouse-style perf check (no install)
npx --yes lighthouse https://pcpower.concreteinfo.co.in --only-categories=performance,accessibility,pwa --quiet --chrome-flags="--headless"
```

### Security headers (CSP)

The strict Content-Security-Policy from design spec §9.3, plus `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`, are declared in **one** place — the source of truth for production:

- **`public/_headers`** — served automatically by Cloudflare Pages on every response. Verifiable with `curl -fsSLI https://pcpower.concreteinfo.co.in/ | grep -i 'content-security-policy'`.

**Important:** there is intentionally **no** `<meta http-equiv="Content-Security-Policy">` in `index.html`. The single-source `_headers` block is what production runs under; duplicating the CSP into a meta tag creates a drift surface where the two fall out of sync and one of them is silently wrong. (Note: `vite dev` / `vite preview` don't honour `_headers` either, but the browser also does not enforce CSP in development the way it does in production, so no fallback is needed.)

If your hosting environment doesn't honour `public/_headers` (e.g. Coolify's bundled Nginx image does not), paste the **exact** block below into the host's response-headers config (Coolify → Application → `pc-power-calculator` → "Headers" / "Custom Headers", or the equivalent in Traefik / Caddy / Nginx). Do not paste a stripped-down copy — keep the full CSP including Google Fonts, the FX subdomain, and the hardening directives (`frame-ancestors 'none'`, `base-uri 'self'`).

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://ipapi.co https://ip-api.com https://api.exchangerate.host https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

If the host UI exposes only individual header fields, set:

- `Content-Security-Policy` = `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://ipapi.co https://ip-api.com https://api.exchangerate.host https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'`
- `X-Content-Type-Options` = `nosniff`
- `Referrer-Policy` = `strict-origin-when-cross-origin`

If a reverse proxy sits in front of the app host (Traefik, Caddy, Nginx), apply the same three headers there instead — never on both, or the proxy will overwrite the app host's set.

---

## 📁 Project structure

```
src/
├── components/        # React components (ui/, layout/, calculator/, compare/, suggestions/, charts/, data/)
├── lib/
│   ├── calc/          # pure calculation engine (no React, no I/O)
│   ├── data/          # data fetching + caching
│   ├── api/           # external API clients (geolocation, FX)
│   └── export/        # PDF + HTML export
├── data/              # bundled JSON (components, tariffs, benchmarks, …)
├── pages/             # route components
├── store/             # Zustand store
├── hooks/
├── types/             # shared TS types
└── styles/            # ConcreteInfo design tokens
```

Full structure in the [design spec](./docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md#74-project-structure).

---

## 🧭 Design

The complete design (architecture, data model, calculation engine, UI, deployment, security, testing, release milestones) lives in [`docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md`](./docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md).

Open items tracked in the spec (license selection, server-workload scope refinement, etc.) will be resolved before each relevant milestone.

---

## 🤝 Contributing

Once the implementation lands, contributions are welcome — especially for:
- New countries / states / provinces in `tariffs.json`
- New components in `components.json`
- New benchmarks in `benchmarks.json`
- UI translations (post-launch)

In the meantime, open an issue to discuss ideas before sending a PR.

---

## 📄 License

License TBD (default MIT — tracked as open item #1 in the design spec).

---

## 🔒 Privacy & Analytics

Google Analytics 4 (GA4) is integrated via **Consent Mode v2** with **default-deny** semantics. The app is fully functional without analytics — tracking only activates for users who explicitly click **Allow analytics** in the cookie banner.

**Tracking is OFF by default.** The `VITE_GA4_MEASUREMENT_ID` environment variable is empty at build time, so no `gtag.js` loader is injected and no GA requests are made. When the variable is set (see setup below), the consent banner appears on first visit and the user chooses:

- **Allow analytics** → `analytics_storage: granted` — page views and export-format events are sent.
- **Decline** → `analytics_storage: denied` — no GA requests fire.

### Setup

1. Create a GA4 property in [Google Analytics](https://analytics.google.com/) for `pcpower.concreteinfo.co.in` (Web stream).
2. Copy the `G-XXXXXXXXXX` Measurement ID.
3. In Coolify, open the `pc-power-calculator` application → **Environment Variables** → add:
   ```
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Trigger a redeploy. Coolify rebuilds with the new env var, the consent banner appears for every visitor, and analytics requests start flowing from opted-in users only.

### What gets tracked

| Event            | When                                          | Params              |
|------------------|-----------------------------------------------|---------------------|
| `page_view`      | Every client-side route change                | `path` (string)     |
| `export_format`  | User clicks Export PDF or Export HTML         | `format`: `pdf`/`html` |
| `consent_update` | User clicks Allow analytics or Decline        | `state`: `granted`/`denied` (for self-monitoring opt-in vs decline ratio) |

Denied users still get full export functionality and full route navigation — `export_format` and `page_view` events are simply not emitted when consent is not `granted`. There are no other tracked events.

### Privacy stance

- **`anonymize_ip: true`** — GA's IP-anonymisation is requested at config time, so the last octet of visitor IPs is stripped before they reach Google's servers.
- **Default-deny consent** — `analytics_storage` and `ad_storage` are both `denied` until the user opts in.
- **No PII** — no email addresses, no usernames, no build contents, no component selections are sent. Only aggregate event names + the public route path.
- **No cross-site tracking** — only the GA4 property for this domain is loaded; no other ad networks, no Facebook Pixel, no third-party cookies beyond GA's own.
- **No advertising features** — `ad_storage` stays `denied` regardless of consent, so ads-personalisation signals are never sent.

For the upstream spec on Consent Mode v2, see [Google's Consent Mode documentation](https://developers.google.com/tag-platform/security/guides/consent).
