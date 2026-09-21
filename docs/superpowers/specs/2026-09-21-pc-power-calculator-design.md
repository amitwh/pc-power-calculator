# PC Power Calculator — Design Spec

| Field | Value |
|-------|-------|
| **Project** | `pc-power-calculator` |
| **Repo** | https://github.com/amitwh/pc-power-calculator |
| **Live URL** | https://pcpower.concreteinfo.co.in |
| **Author** | Amit Haridas |
| **Date** | 2026-09-21 |
| **Status** | ✅ Approved — ready for implementation planning |
| **License** | TBD (default MIT) |

## 1. Summary

A stateless, browser-based calculator that estimates the **power consumption** and **electricity cost** of a personal computer in any local currency, with side-by-side build comparison and lower-power alternatives suggestions.

Users pick their components, set a usage schedule (hours/day at each workload), confirm their location's electricity tariff, and immediately see kWh / ₹ per day / month / year — plus workload-specific performance estimates and suggestions for lower-power alternatives that retain ≥90 % of the relevant performance.

**Target audience:** anyone who runs a PC and wants to know what it costs in their local currency. Mobile-first because 60–80 % of traffic is expected on phones.

## 2. Goals & non-goals

### Goals
- Ship a working calculator in v1 with curated data for ~300 components and ~50 countries.
- Global reach via Cloudflare CDN and per-country, per-subdivision tariffs.
- Workload-aware comparisons (gaming, content creation, productivity + dev, AI/ML + mining, server).
- Offline-capable PWA — usable after first load with no network.
- Mobile-first responsive, accessible (WCAG AA), fast (Lighthouse ≥ 90).
- Privacy-respecting: no accounts, no third-party tracking, no backend.

### Non-goals (v1)
- No accounts, saved builds across devices, or cloud sync.
- No backend server, no database, no admin UI.
- No community submission UI (GitHub PRs only).
- No automated data-scraper pipeline (manual JSON updates).
- No native mobile apps (PWA is sufficient).

## 3. Confirmed decisions

| Question | Decision |
|----------|----------|
| Scope | Stateless calculator — no accounts, no saved builds, no backend, no database in v1. |
| Data sources | Bundled curated JSON (components + tariffs + currencies) + free public APIs for FX and geolocation fallback + always-available manual override. |
| Comparison depth | Workload-specific performance estimates (with curated benchmark database). |
| v1 workloads | Gaming, Content creation, Productivity + dev, AI/ML + mining, Server workloads (home server / NAS / always-on). |
| Deployment | Coolify + ConcreteInfo, served behind Cloudflare (global CDN). |
| Domain | `pcpower.concreteinfo.co.in` |
| Build tool | Vite + React-TS SPA |
| Currency | Local-currency rates per country AND per sub-national administration (state / province), with manual override and FX fallback. |
| Location | Auto-detect via IP geolocation (ipapi.co), with manual country + subdivision selector. |
| Fonts | Plus Jakarta Sans (body) · Inter (display / numeric, **replaces** Barlow Condensed) · SF Mono / Fira Code (monospace) |
| Export | PDF (via `window.print()` + print stylesheet) and HTML (self-contained with embedded JSON for re-import). |
| Mobile | First-class NFR. Mobile-first responsive, tested on real devices. |
| PWA | First-class. Installable, offline-capable, "Add to Home Screen" prompt. |

## 4. Architecture

### 4.1 Stack

| Layer | Choice |
|-------|--------|
| Build tool | Vite 5 |
| Framework | React 18 + TypeScript 5 |
| Routing | React Router v6 (hash routing) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Data tables | TanStack Table v8 |
| Charts | ApexCharts (`react-apexcharts`) |
| Styling | Tailwind CSS + ConcreteInfo design tokens |
| PWA | `vite-plugin-pwa` (Workbox under the hood) |
| Unit tests | Vitest + React Testing Library + `fast-check` |
| E2E tests | Playwright + `@axe-core/playwright` |
| Visual regression | Playwright screenshots |
| Performance | Lighthouse CI |

### 4.2 High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (client)                        │
│                                                                  │
│  ┌────────────────┐   ┌──────────────────┐   ┌────────────────┐  │
│  │  UI components │──▶│ Calculation      │──▶│ Results store  │  │
│  │  (React +      │   │ engine (pure     │   │ (Zustand,      │  │
│  │   ConcreteInfo │   │  functions in    │   │  in-memory     │  │
│  │   design system)│   │  TS)             │   │  + localStorage│  │
│  └────────────────┘   └──────────────────┘   └────────────────┘  │
│           │                     ▲                                │
│           ▼                     │                                │
│  ┌──────────────────────────────────────────┐                    │
│  │ Data layer                               │                    │
│  │  • components.json  (bundled, eager)     │                    │
│  │  • tariffs.json     (bundled, eager)     │                    │
│  │  • currencies.json  (bundled, eager)     │                    │
│  │  • benchmarks.json  (bundled, lazy)      │                    │
│  │  • fx_rates.json    (bundled snapshot)   │                    │
│  │  • ipapi.co/json/   (geolocation API)    │                    │
│  │  • exchangerate.host/latest (FX API)     │                    │
│  └──────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌────────────────────────────────────────┐
        │  Static host (Coolify + Cloudflare)   │
        │  /assets/*.json, /assets/*.js,        │
        │  manifest.json, sw.js, index.html     │
        └────────────────────────────────────────┘
```

### 4.3 Properties
- Pure client-side calculation. Fully usable offline once loaded.
- Data is versioned — each JSON carries `version` + `lastUpdated`.
- Graceful degradation when APIs are unavailable.
- No secrets in bundle. All APIs are unauthenticated free tiers.
- PWA installable with offline-first service worker.

## 5. Data model

Five bundled JSON files + two runtime API calls. Bundled files live in `src/data/*.json`, imported as ES modules by Vite.

### 5.1 `components.json`

```ts
type ComponentCategory =
  | 'cpu' | 'gpu' | 'ram' | 'storage' | 'motherboard'
  | 'psu' | 'monitor' | 'cooler' | 'add_in_card'
  | 'optical_drive' | 'ups' | 'peripheral';

interface Component {
  id: string;                 // 'cpu-amd-ryzen-7-7800x3d'
  category: ComponentCategory;
  brand: string;
  model: string;
  releaseYear: number;
  tdp_w: number | null;       // rated TDP in watts; null for passive parts
  specs: Record<string, string | number | boolean>;
  source: string;             // 'amd.com/specs' or 'manual'
  addedAt: string;            // ISO date
}
```

**Category-specific spec fields:**

| Category | Spec fields |
|----------|-------------|
| `cpu` | `cores`, `threads`, `base_ghz`, `boost_ghz`, `socket`, `process_nm` |
| `gpu` | `vram_gb`, `vram_type`, `length_mm`, `cuda_cores` (NVIDIA) / `stream_processors` (AMD) |
| `ram` | `size_gb`, `type` (DDR4/DDR5), `speed_mt_s`, `sticks` (per-stick watt) |
| `storage` | `capacity_gb`, `type` (HDD/SATA-SSD/NVMe), `read_mbps`, `write_mbps`, `tbw` (endurance) |
| `motherboard` | `socket`, `chipset`, `form_factor` (ATX/mATX/ITX), `ram_type`, `max_ram_gb`, `m2_slots`, `sata_ports`, `wifi`, `pcie_version` |
| `psu` | `wattage_w`, `efficiency` (80+ Bronze/Gold/Platinum/Titanium), `modular` |
| `monitor` | `size_in`, `resolution`, `refresh_hz`, `panel` (IPS/OLED/VA), `hdr`, `brightness_nit` |
| `cooler` | `type` (air/AIO), `fans`, `noise_db`, `tdp_rating_w` |
| `add_in_card` | `subtype` (capture/sound/NIC), `interface` (PCIe x1/x4/x16), `watts` |
| `optical_drive` | `type` (DVD/Blu-ray), `write_speed` |
| `ups` | `capacity_va`, `capacity_w`, `efficiency_pct`, `bypass` |
| `peripheral` | `subtype` (fan/RGB strip/USB hub/speaker/headset/printer), `watts` |

### 5.2 `tariffs.json`

```ts
interface TariffSchedule {
  country_iso2: string;
  country_name: string;
  subdivisions?: TariffDivision[];
  default: TariffRate;
  applicableTaxes?: TaxRule[];
  notes?: string;
  lastUpdated: string;
}

interface TariffDivision {
  code: string;               // 'IN-KL', 'US-CA'
  name: string;               // 'Kerala', 'California'
  rate: TariffRate;
}

interface TariffRate {
  flat?: number;
  currency: string;
  slabs?: TariffSlab[];
}

interface TariffSlab {
  upTo_kwh: number | null;
  rate: number;
}

interface TaxRule {
  name: string;
  rate_pct: number;
  appliesTo?: 'energy' | 'total';
}
```

### 5.3 `benchmarks.json`

```ts
type WorkloadId =
  | 'gaming_1080p' | 'gaming_1440p' | 'gaming_4k'
  | 'render_blender' | 'video_premiere' | 'photo_lightroom'
  | 'compile' | 'office' | 'browser'
  | 'llm_inference' | 'training' | 'mining_etc' | 'mining_kawpow'
  | 'server_idle' | 'server_light' | 'server_heavy';

interface Workload {
  id: WorkloadId;
  name: string;
  category: 'gaming' | 'content' | 'productivity' | 'ai' | 'mining' | 'server';
  description: string;
  utilization: {
    cpu_pct: number;          // 0..1
    gpu_pct: number;
    ram_pct: number;
    storage_pct: number;
    monitor_w: number;
  };
  benchmarks: BenchmarkEntry[];
}

interface BenchmarkEntry {
  component_id: string;
  metric: string;             // 'fps', 'seconds', 'tokens_per_sec', 'hashrate_mhs'
  value: number;
  unit: string;
  context?: Record<string, string>;
  source: string;
}
```

**"Server workloads" clarification:** v1 covers home server / NAS / Plex / always-on workstation (24/7 low-to-mid utilization). Datacenter rack virtualization and HPC are out of scope for v1.

### 5.4 `currencies.json`

```ts
interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalDigits: number;
}
```

### 5.5 `fx_rates.json` (bundled snapshot)

```ts
interface FxSnapshot {
  base: string;               // 'USD'
  date: string;
  rates: Record<string, number>;
  source: string;
}
```

### 5.6 `power_profiles.json` (idle/TDP ratios + PSU curves)

Per-component-class idle power ratios and PSU efficiency curves. Curated, not user-editable.

```ts
type IdleRatioClass =
  | 'desktop_cpu' | 'desktop_gpu' | 'ram_stick'
  | 'nvme_ssd' | 'sata_ssd' | 'hdd_7200'
  | 'motherboard_chipset';

interface IdleRatio {
  class: IdleRatioClass;
  idle_w: number;             // watts at idle / standby
  active_w: number;           // watts at full load
  // For chip-based parts where idle scales with TDP:
  idle_fraction_of_tdp?: number;   // e.g. 0.15 for CPU
}

interface PsuCurve {
  rating: '80-plus' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'titanium';
  load_pct: number;           // 10, 20, 50, 100
  efficiency: number;         // 0.80 .. 0.94
}
```

### 5.7 `BuildConfig` (in-memory + localStorage)

```ts
interface BuildConfig {
  id: string;                 // UUID for export/import
  name: string;
  components: {
    cpu?: string;
    gpu?: string;
    ram?: string[];
    storage?: string[];
    motherboard?: string;     // ← added (per data feedback)
    psu?: string;
    cooler?: string;
    monitors?: string[];
    add_in_cards?: string[];
    optical_drives?: string[];
    ups?: string;
    peripherals?: string[];
  };
  schedule: WorkloadSchedule[];
  location: {
    country_iso2: string;
    subdivision_code?: string;
    manual_rate_override?: number;
  };
  currency_override?: string;
}

interface WorkloadSchedule {
  workload_id: WorkloadId;
  hours_per_day: number;      // 0..24
  days_per_week?: number;     // default 7
}
```

### 5.8 Data curation plan (v1)

| Category | v1 target | Sourcing |
|----------|-----------|----------|
| CPU | 100+ (top Intel + AMD desktop, last 6 years) | Manufacturer spec sheets |
| GPU | 80+ (NVIDIA + AMD, last 5 years) | TechPowerUp GPU database |
| RAM | 20 representative sticks | Manufacturer specs |
| Storage | 30 HDDs + 30 SSDs + 30 NVMe | Manufacturer specs |
| Motherboard | 30 (popular chipsets × brands) | Manufacturer specs |
| PSU | 30 (top-rated per efficiency tier) | 80+ database + manufacturer specs |
| Monitor | 30 (popular sizes/resolutions) | Manufacturer specs |
| Cooler | 20 (popular air + AIO) | Manufacturer specs |
| Add-in cards | 10 (capture, NIC, sound) | Manufacturer specs |
| UPS | 10 (popular home/SMB) | Manufacturer specs |
| Peripheral | 50 (fans, RGB, USB hubs, headsets, speakers, printers) | Manufacturer specs |

**Benchmarks (v1):**

| Workload | Source | Coverage |
|----------|--------|----------|
| Gaming | TechPowerUp / Hardware Unboxed / Gamers Nexus | Top 30 GPUs × top 20 CPUs at 1080p / 1440p / 4K |
| Rendering (Blender) | Blender Open Data | Top 50 CPUs + Top 30 GPUs |
| Video editing | Puget Systems | Top 30 CPUs + Top 20 GPUs |
| Office / compile | PassMark / Geekbench | Top 50 CPUs |
| AI inference | MLPerf + community | Top 20 GPUs |
| Mining | WhatToMine, hashcat | Top 30 GPUs |
| Server | Spec sheet idle power | Top 20 components |

**Tariffs (v1):**

Hand-curated for India (all states), US (all states), UK, EU major countries, and 10 additional popular countries.

**Estimated bundle sizes:**

| File | Size |
|------|------|
| components.json | 80–150 KB |
| tariffs.json | 30–60 KB |
| benchmarks.json (lazy) | 200–500 KB |
| currencies.json | < 5 KB |
| fx_rates.json | < 5 KB |
| power_profiles.json | < 5 KB |
| **Total uncompressed** | ~500 KB |
| **Total gzipped** | ~120–150 KB |

## 6. Calculation engine

Pure TypeScript functions in `src/lib/calc/`. No React, no I/O. 100 % unit-tested.

### 6.1 Per-component power at a workload

```
P_component(w) = P_idle(component) + (P_tdp(component) − P_idle(component)) × util(w, component)
```

Reference idle/TDP ratios:

| Component class | Idle vs TDP |
|-----------------|-------------|
| Desktop CPU | ~15 % of TDP |
| Desktop GPU | ~10 % of TDP |
| RAM stick | constant ~3–5 W |
| NVMe SSD | ~0.1 W idle, ~5 W active |
| SATA SSD | ~0.5 W idle, ~3 W active |
| HDD (7200 rpm) | ~5 W idle, ~8 W active |
| Monitor | constant (panel wattage) |
| Motherboard | chipset-dependent (X670 ~10 W, B650 ~7 W, Z790 ~10 W, B760 ~7 W) |
| Fans / RGB / peripherals | constant (from spec) |

### 6.2 PSU efficiency

PSU efficiency varies with load. Bundled curves in `src/data/psu_curves.json`:

```ts
interface PsuCurve {
  rating: '80-plus' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'titanium';
  load_pct: number;           // 10, 20, 50, 100
  efficiency: number;
}

function psuEfficiency(rating, load_pct): number // linear interpolation between 4 points
```

**Wall draw** = sum of component power ÷ efficiency. If no PSU selected → 85 % flat fallback.

### 6.3 Cost computation

```ts
function computeCost(
  energy_kwh: number,
  tariff: TariffRate,
  taxes: TaxRule[]
): { subtotal: number; taxBreakdown: Record<string, number>; total: number }
```

Handles flat rates, tiered (slab) rates, and per-rule taxes.

### 6.4 Energy over time

```ts
function computeEnergy(
  build: BuildConfig,
  benchmarks: BenchmarkEntry[],
  period: 'day' | 'month' | 'year'
): {
  perWorkload: { workload_id: WorkloadId; kwh: number; cost: number; perfMetrics: PerfMetric[] }[];
  total: { kwh: number; cost: number };
}
```

Day is the base; monthly = daily × 30.44; yearly = daily × 365.25.

### 6.5 Comparison engine

```ts
function compareBuilds(
  builds: BuildConfig[],
  benchmarks: BenchmarkEntry[]
): ComparisonRow[];
```

Per-workload diff metric: $/hashrate (mining, server) or FPS / render time (gaming, content).

### 6.6 Suggestion engine (rule-based, no ML)

```ts
interface Suggestion {
  component_id: string;
  category: ComponentCategory;
  current: { tdp_w: number; perf_score: number };
  alternative: Component;
  alt: { tdp_w: number; perf_score: number };
  impact: {
    kwh_saved_per_year: number;
    cost_saved_per_year: number;
    perf_retention_pct: number;
  };
}

function suggestAlternatives(build, benchmarks): Suggestion[];
```

For each component, finds lower-power alternatives with ≥90 % of the relevant benchmark. UI caveat: "Suggestions are heuristic — verify benchmarks before swapping."

### 6.7 Currency formatting

```ts
function formatCost(amount: number, currency: CurrencyInfo): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: currency.decimalDigits,
  }).format(amount);
}
```

### 6.8 Test strategy for the engine

| Layer | Tool | Coverage |
|-------|------|----------|
| Pure functions | Vitest | 100 % line |
| Property-based | `fast-check` | Slab walks, edge cases |
| Numerical sanity | Snapshot tests | Hand-computed reference cases |
| Edge cases | Vitest | Empty schedule, leap year, etc. |

**End-to-end fixture:** Ryzen 7 7800X3D + RTX 4070 + 32 GB DDR5 + 1 TB NVMe, 4 h gaming + 8 h office + 12 h idle, Kerala ₹7.50/unit → expected ~₹X/year. Regression test every PR.

## 7. UI / screens / components

### 7.1 Routes

| Route | Page |
|-------|------|
| `/` | Home / Calculator |
| `/compare` | Compare 2–N builds |
| `/suggestions` | Lower-power alternatives |
| `/data` | Data freshness + refresh |
| `/about` | Methodology + license + contribute |

### 7.2 Layout (desktop, ≥1024 px)

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚡ PC Power Calculator  [Calc][Compare][Suggest][Data][?]         │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐   ┌──────────────────────────────┐    │
│  │ 1. Your Build        │   │ 2. Location & Tariff           │    │
│  │  [+] CPU    …       │   │ Country [India ▼]              │    │
│  │  [+] GPU    …       │   │ State   [Kerala ▼]             │    │
│  │  [+] RAM    …       │   │ Tariff  ₹7.50/kWh (auto)        │    │
│  │  [+] MB     …       │   │ Override [        ] /kWh       │    │
│  │  [+] SSD    …       │   │ Currency ₹ INR                  │    │
│  │  [+] PSU    …       │   │ Last updated 2025-12-01         │    │
│  │  [+] ...            │   │ [Detect from IP ↻]               │    │
│  └──────────────────────┘   └──────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 3. Usage schedule                                          │  │
│  │ Gaming (1080p) [────●─────] 4 h/day                          │  │
│  │ Office       [──●─────────] 1 h/day                          │  │
│  │ Idle         [──────────●] 11 h/day                         │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 4. Results                                                 │  │
│  │ ┌─────────┬─────────┬─────────┐                              │  │
│  │ │ Daily   │ Monthly │ Yearly  │                              │  │
│  │ │ 1.2 kWh │ 36 kWh  │ 442 kWh │                              │  │
│  │ │ ₹9.00  │ ₹273   │ ₹3,318 │                              │  │
│  │ └─────────┴─────────┴─────────┘                              │  │
│  │ Power breakdown  ▓▓▓▓▓▓▓░░░ CPU 95W   ▓▓▓▓▓▓▓▓░░ GPU 220W   │  │
│  │                  ▓▓░░░░░░░░░░░ RAM 12W                         │  │
│  │ [Compare] [Suggest] [Export PDF] [Export HTML]                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Mobile (≤768 px)
- Single column. Top nav collapses to hamburger.
- Bottom nav: Calculator · Compare · Suggest · Data · About (≤5 items).
- Component cards stack; "Add component" = full-width sticky CTA.
- Schedule uses compact slider rows.
- Results become tabs (Daily / Monthly / Yearly).
- Comparison table: hide secondary columns, tap row for full-detail drawer.

### 7.4 Project structure

```
src/
├── components/
│   ├── ui/                      # ConcreteInfo primitives
│   ├── layout/                  # TopNav, Sidebar, MobileNav
│   ├── calculator/              # BuildPicker, ComponentCard, ScheduleEditor, LocationPicker, ResultsPanel
│   ├── compare/                 # BuildSelector, ComparisonTable (TanStack Table v8)
│   ├── suggestions/             # SuggestionCard
│   ├── charts/                  # PowerBreakdown, CostOverTime, ComparisonBars (ApexCharts)
│   └── data/                    # FreshnessBanner
├── lib/
│   ├── calc/                    # pure calc engine
│   ├── data/                    # data fetching + caching
│   ├── api/                     # ipapi, exchangerate.host, tariff lookup
│   └── export/                  # PDF + HTML
├── data/                        # bundled JSON
├── pages/                       # Home, Compare, Suggestions, DataFreshness, About
├── store/                       # buildStore.ts (Zustand)
├── hooks/
├── types/
└── styles/
    └── tokens.css               # ConcreteInfo + Inter design tokens
```

### 7.5 ConcreteInfo design tokens (updated)

| Token | Value |
|-------|-------|
| Brand | Primary `#e5461f` · Dark `#c93a18` · Light `#ff6b47` |
| Semantic | Success `#1a7a56` · Warning `hsl(45,93%,47%)` · Danger `hsl(0,84%,60%)` · Info `hsl(199,89%,48%)` |
| Grays | 50:`#fafbfc` → 950:`#0d0b09` |
| **Body font** | Plus Jakarta Sans 400–800 |
| **Display font** | **Inter** 600/700/800 *(replaces Barlow Condensed)* |
| **Numeric font** | Inter with `font-variant-numeric: tabular-nums` |
| **Mono font** | SF Mono / Fira Code |
| Base size | 15 px |
| Sidebar | 264 px (collapsed 72 px) |
| Header | 64 px |
| Radii | 4 / 8 / 12 / 16 px |
| Dark mode | `.dark` on `<html>`, `darkMode: 'class'`, 300 ms transition |

### 7.6 UX patterns (per ConcreteInfo design system)
- Skeletons over spinners.
- 300 ms ease-in-out transitions.
- Empty states: icon + "No [items] found" + primary CTA.
- Toasts 3–5 s; modal only for destructive confirms.
- Stat cards: label + large value (Inter tabular) + trend indicator.
- Filters: collapsible sidebar or top bar with "Active Filters" tags.
- 8 px minimum padding/gap in data-dense views.

### 7.7 Mobile responsiveness — first-class NFR

| Concern | Requirement |
|---------|-------------|
| Breakpoints | Mobile-first 640 / 768 / 1024 / 1280 / 1536 px |
| Touch targets | Minimum 44×44 px |
| Input font-size | ≥ 16 px (prevents iOS auto-zoom) |
| `inputmode` | `numeric` on kWh / ₹ / hours inputs |
| Thumb zone | Primary actions in bottom 30 % or fixed bottom action bar |
| Safe areas | `padding: env(safe-area-inset-*)` on top nav, bottom action bar |
| Tables on mobile | Hide secondary columns, drawer drill-down, scroll indicator |
| Charts on mobile | Legend below chart at small widths, axis labels truncated |
| Bottom nav | ≤ 5 items (Calculator / Compare / Suggest / Data / About) |
| Network-aware | `navigator.connection.effectiveType`, reduce quality on 2G/3G |
| Tested devices | iPhone SE, iPhone 14 Pro, Pixel 7, Galaxy S22, iPad Mini (BrowserStack) |

A dedicated **mobile QA pass is a release-blocker**.

### 7.8 PWA — first-class requirement

| Concern | Requirement |
|---------|-------------|
| Manifest | `manifest.json` with `name`, `short_name`, `theme_color: "#e5461f"`, `background_color: "#0d0b09"`, `display: "standalone"`, `orientation: "any"`, icons (192, 512, maskable) |
| iOS | `apple-mobile-web-app-capable=yes`, `status-bar-style=black-translucent`, `apple-touch-icon` |
| Service worker | `vite-plugin-pwa` (Workbox). Cache-first for static assets, stale-while-revalidate for JSON, network-first for APIs |
| App shell | Instant shell render, hydrate content async — never blank-screen on load |
| Offline | Show cached data with "Last synced" banner; never a blank error screen |
| Install prompt | Detect `beforeinstallprompt`, show custom UI after 3 meaningful interactions |
| Splash | Custom splash using `theme_color` and `apple-touch-icon` |
| Viewport | `100dvh` with `100vh` fallback for iOS Safari address bar quirks |

### 7.9 Export — PDF + HTML

| Format | Implementation |
|--------|---------------|
| **PDF** | Browser `window.print()` with print stylesheet that hides nav and shows clean results. User picks "Save as PDF" in the dialog. Zero deps. |
| **HTML** | Self-contained HTML string: inlined CSS, inlined SVG charts, embedded build-config JSON in `<script type="application/json">`. Filename: `pc-power-build-YYYY-MM-DD.html`. Offers "Re-import this build" on open. |

### 7.10 Error handling

| Failure | UI behaviour |
|---------|--------------|
| Component JSON load fails | Won't ship (Vite build-time failure) |
| Geolocation API fails | Country selector with India pre-selected |
| FX API fails | Use bundled 7-day snapshot, banner "FX as of YYYY-MM-DD" |
| Tariff missing for country | Notice + manual-rate input |
| Benchmark missing for (component, workload) | Hide perf metric for that row; show power + cost |
| Invalid combo (AM5 CPU + AM4 MB) | Yellow warning chip; allow calculation |

## 8. Data flow, state, runtime APIs

### 8.1 State (Zustand)

```ts
interface BuildStore {
  build: BuildConfig;
  location: { country: string; subdivision?: string; detected: boolean };
  currency: CurrencyInfo;
  fxSnapshot: FxSnapshot | null;
  isOnline: boolean;

  setComponent(slot: ComponentSlot, id: string | null): void;
  setSchedule(schedule: WorkloadSchedule[]): void;
  setLocation(country: string, subdivision?: string): void;
  setCurrency(c: CurrencyInfo): void;
  setManualRate(rate: number | null): void;
  resetBuild(): void;
  exportBuild(): string;
  importBuild(json: string): void;
}
```

### 8.2 First-load sequence

1. App shell mounts (cached after first PWA install).
2. Eagerly loaded: `components.json`, `tariffs.json`, `currencies.json`.
3. Lazy-loaded on first Compare/Suggestions open: `benchmarks.json`.
4. Fire-and-forget: IP geolocation + FX rates.
5. User picks components / schedule / location → calc engine computes → results render.

### 8.3 Caching

| Data | Strategy |
|------|----------|
| components.json | Vite bundle (eager) · SW `cacheFirst` |
| tariffs.json | Vite bundle (eager) · SW `cacheFirst` |
| currencies.json | Vite bundle (eager) · SW `cacheFirst` |
| benchmarks.json | Dynamic import · SW `staleWhileRevalidate` |
| fx_rates.json | Vite bundle snapshot · SW `staleWhileRevalidate` from API |
| Geolocation result | `sessionStorage` |
| Current build | `localStorage` (so refresh doesn't lose work) |

### 8.4 External API clients (`src/lib/api/`)

```ts
// geolocation.ts — 3s timeout, returns null on failure
detectLocation(): Promise<{ country_iso2: string; subdivision?: string } | null>

// fx.ts — 3s timeout, returns null on failure
fetchFxRates(base = 'USD'): Promise<FxSnapshot | null>

// tariff-lookup.ts — fallback for countries not in bundled JSON
lookupTariff(country: string): Promise<TariffRate | null>
```

All three use `AbortController` with 3 s timeout, return `null` on failure, never throw to UI.

### 8.5 Sharing

1. **URL fragment** — base64-encoded JSON in URL: `/#/compare?builds=<base64>`. No backend needed.
2. **HTML export** — embeds build JSON; on open offers "Re-import into PC Power Calculator".

### 8.6 Performance budget

| Metric | Target |
|--------|--------|
| Initial JS bundle (gzipped) | < 200 KB |
| First Contentful Paint | < 1.5 s on 4G |
| Time to Interactive | < 2.5 s on 4G |
| benchmarks.json (lazy) | < 300 KB gzipped |
| Lighthouse Performance | ≥ 90 |
| Lighthouse A11y | ≥ 95 |

## 9. Deployment & infrastructure

### 9.1 Pipeline

```
PR push → GitHub Actions (typecheck, unit, a11y, visual, lighthouse, build)
       → upload to Coolify PR preview → comment with preview URL

Merge to main → Coolify auto-deploy → Cloudflare cache purge for index.html → GitHub release
```

Data-only JSON changes deploy automatically — no code redeploy.

### 9.2 Infrastructure

| Resource | Choice |
|----------|--------|
| Hosting | Coolify static site (existing ConcreteInfo instance) |
| CDN | Cloudflare (in front of Coolify) |
| Domain | `pcpower.concreteinfo.co.in` (subdomain of ConcreteInfo primary domain) |
| TLS | Cloudflare universal SSL |
| Build artifact | Vite static output (`dist/`) |

### 9.3 Security

| Concern | Approach |
|---------|----------|
| Transport | HTTPS only. HSTS preload eligible. |
| **CSP** | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://ipapi.co https://ip-api.com https://exchangerate.host; img-src 'self' data:;` |
| No secrets | All APIs unauthenticated. CI greps bundle for `api_key`/`secret`/`token`. |
| Dependency scanning | `npm audit --audit-level=high` + `osv-scanner` in CI. |
| User input | Zod validation. Manual rate clamped ≥ 0. NaN checks. |
| Privacy | IP-based geo only, no precise GPS. No tracking pixels. localStorage only for own build. |

## 10. Testing strategy

| Layer | Tool | Target |
|-------|------|--------|
| Calculation engine | Vitest + `fast-check` | 100 % coverage |
| Store / state | Vitest | All actions, persistence, import/export |
| API clients | Vitest + MSW | Network failures, timeouts, malformed responses |
| Components | Vitest + RTL | Render, interaction, a11y |
| E2E | Playwright | Calculator happy path, compare, suggest, export PDF/HTML, offline mode |
| Visual | Playwright screenshots | 5 key screens × 2 themes |
| A11y | `@axe-core/playwright` | WCAG AA across all pages |
| Performance | Lighthouse CI | Performance budget enforced |

CI runs unit + component + a11y + visual on every PR. E2E + Lighthouse runs on `main` and tags.

## 11. Release milestones

| Milestone | Scope | Done when |
|-----------|-------|-----------|
| **M0 — Skeleton** | Vite + React-TS, ConcreteInfo tokens, top nav, "hello world" on `/`. Deployed to Coolify. | Live at `pcpower.concreteinfo.co.in`, Lighthouse ≥ 90. |
| **M1 — Core calculator** | Component picker (all 12 categories), schedule editor, flat-rate cost, single-workload result, India + 5 countries tariff. | E2E calculation works for one country. |
| **M2 — Localisation** | Country + state/province selector, geolocation auto-detect, multi-currency, manual override, tiered tariffs. | Full country + subdivision picker working. |
| **M3 — Comparison** | 2–N build comparison, per-workload cost table, comparison bars chart. | Side-by-side working with PDF + HTML export. |
| **M4 — Suggestions** | Rule-based alternatives engine with workload-specific perf. | Top 3 suggestions per build, with workload context. |
| **M5 — Benchmark data** | Curated benchmarks for top 30 GPUs + top 20 CPUs across all 5 workload categories. | All workload metrics render when components have data. |
| **M6 — Polish** | PWA install prompt, offline support, full a11y pass, mobile QA pass on 5 devices. | Lighthouse PWA ≥ 90, a11y ≥ 95, mobile tests green. |
| **M7 — Launch** | Public announcement, `about:methodology` page, contribution guide, license added. | First GitHub release tagged. |

## 12. Open items

| # | Item | Default if no decision | Decision needed by |
|---|------|------------------------|-------------------|
| 1 | **License** | MIT | M0 |
| 2 | **Domain** | ✅ **Resolved:** `pcpower.concreteinfo.co.in` | — |
| 3 | **Server workloads definition** | ✅ **Resolved:** home server / NAS / Plex / always-on workstation (24/7 low-to-mid utilization) | — |
| 4 | **Tariff data sources for v1** | India (all states), US (all states), UK, EU, +10 popular countries — hand-curated | M2 |
| 5 | **Benchmark data scope** | Top 30 GPUs + top 20 CPUs × 5 workload categories in v1 | M5 |
| 6 | **Tax/VAT handling** | Single user-typable % per location (default 0); per-region rules in `tariffs.json` | M2 |
| 7 | **i18n / multi-language UI** | English-only in v1 | Post-launch |
| 8 | **Auto-refresh data pipeline** | Manual PRs in v1; auto-scraper in v2 | Post-launch |
| 9 | **User submissions of components** | GitHub PRs only in v1; in-app form in v2 | Post-launch |
| 10 | **PWA push notifications** | Not in v1 | Post-launch |

## 13. Repo metadata (post-approval actions)

| Item | Status |
|------|--------|
| Repo | https://github.com/amitwh/pc-power-calculator ✅ created |
| README | ✅ in place (will be updated as design lands) |
| License | TBD |
| Live URL | https://pcpower.concreteinfo.co.in |
| Topics | `pc-power-calculator` · `electricity` · `calculator` · `react` · `typescript` · `pwa` · `vite` · `concreteinfo` |
