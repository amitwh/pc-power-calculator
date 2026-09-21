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
npm run test:e2e          # playwright e2e
npm run test:a11y         # axe-core a11y
npm run lighthouse        # lighthouse CI

# build for production
npm run build

# preview production build
npm run preview
```

Open http://localhost:5173 in your browser.

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
