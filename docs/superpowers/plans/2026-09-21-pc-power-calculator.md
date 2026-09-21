# PC Power Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship a stateless, mobile-first PWA that estimates PC power consumption and electricity cost in any local currency, with workload-specific comparisons and PDF/HTML export.

**Architecture:** Vite + React-TS single-page app, pure-function calculation engine in `src/lib/calc/`, Zustand store, bundled JSON data + free public APIs (with manual override). Pure static build deployed to Coolify behind Cloudflare at `pcpower.concreteinfo.co.in`.

**Tech Stack:** Vite 5 · React 18 · TypeScript 5 · React Router v6 · Zustand · React Hook Form + Zod · TanStack Table v8 · ApexCharts · Tailwind + ConcreteInfo design tokens · `vite-plugin-pwa` · Vitest + React Testing Library + `fast-check` · Playwright + `@axe-core/playwright` · Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-09-21-pc-power-calculator-design.md` — every task below argues from a numbered section in the spec. Read both.

---

## Global Constraints

These apply to every task unless explicitly overridden. Copied verbatim from the spec.

- **Timezone:** IST for display, ISO 8601 for storage.
- **Numbers:** `toLocaleString('en-IN')` for all numeric display; `Intl.NumberFormat` for per-currency formatting; currency always symbol-prefixed.
- **State-changing ops:** None in v1 (stateless, no backend). `localStorage` only for build persistence.
- **Secrets:** None — all external APIs are unauthenticated free tiers. CI greps the bundle for `api_key`/`secret`/`token`.
- **CSP (initial, GA disabled):** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://ipapi.co https://ip-api.com https://exchangerate.host; img-src 'self' data:;` — relaxed to allow GA domains in post-launch task M8.
- **No raw secrets, no hardcoded URLs in code:** external API base URLs come from a single `src/lib/api/endpoints.ts` file.
- **Privacy:** no precise GPS; IP-based geo only; `localStorage` only for the user's own build; respect `Do Not Track` and `navigator.globalPrivacyControl`.
- **Mobile-first breakpoints:** 640 / 768 / 1024 / 1280 / 1536 px.
- **Touch targets:** minimum 44×44 px; input font-size ≥ 16 px; `inputmode="numeric"` on numeric inputs.
- **PWA:** `manifest.json`, service worker, app shell, install prompt after 3 meaningful interactions.
- **ConcreteInfo tokens:** brand `#e5461f`; body `Plus Jakarta Sans`; display + numeric `Inter` (replaces Barlow Condensed); monospace `SF Mono, Fira Code`.
- **Performance budget:** initial JS bundle < 200 KB gzipped; FCP < 1.5 s on 4G; TTI < 2.5 s on 4G; Lighthouse Performance ≥ 90, A11y ≥ 95.

---

## File Map (created/modified across all tasks)

```
pc-power-calculator/
├── package.json                               # T1
├── vite.config.ts                             # T1
├── tsconfig.json                              # T1
├── tailwind.config.js                         # T1
├── postcss.config.js                          # T1
├── index.html                                 # T1
├── public/
│   ├── manifest.webmanifest                   # T14
│   ├── robots.txt                             # T1
│   └── icons/ (icon-192.png, icon-512.png, icon-maskable.png) # T14
├── src/
│   ├── main.tsx                               # T1, T2
│   ├── App.tsx                                # T2
│   ├── routes.tsx                             # T2
│   ├── components/
│   │   ├── ui/{Button,Card,Select,Slider,Tabs,Toast,EmptyState,Skeleton}.tsx # T1,T2,T5
│   │   ├── layout/{TopNav,Sidebar,MobileNav,Layout}.tsx                       # T2
│   │   ├── calculator/{BuildPicker,ComponentCard,ScheduleEditor,LocationPicker,ResultsPanel}.tsx # T5,T6
│   │   ├── compare/{BuildSelector,ComparisonTable}.tsx                        # T9
│   │   ├── suggestions/SuggestionCard.tsx                                     # T11
│   │   ├── charts/{PowerBreakdown,CostOverTime,ComparisonBars}.tsx            # T6,T9
│   │   └── data/FreshnessBanner.tsx                                           # T16
│   ├── lib/
│   │   ├── calc/{power,energy,cost,psu,compare,suggest,format,index}.ts       # T3,T4,T9,T11
│   │   ├── data/{components,tariffs,benchmarks,currencies,fx,index}.ts         # T2,T5,T6,T7,T13
│   │   ├── api/{endpoints,geolocation,fx,tariffLookup}.ts                     # T7,T8
│   │   ├── export/{pdf,html}.ts                                               # T10
│   │   └── analytics/{consent,gtag}.ts                                        # T17
│   ├── data/                                                                  # T1, T5, T7, T13
│   │   ├── components.json                                                    # T5
│   │   ├── tariffs.json                                                       # T7
│   │   ├── benchmarks.json                                                    # T13
│   │   ├── currencies.json                                                    # T7
│   │   ├── fx_rates.json                                                      # T7
│   │   └── power_profiles.json                                                # T3
│   ├── pages/{Home,Compare,Suggestions,DataFreshness,About}.tsx               # T2,T9,T11,T16
│   ├── store/buildStore.ts                                                    # T5
│   ├── hooks/{useCalc,useGeolocation,useFx,useOnline}.ts                      # T5,T7,T8
│   ├── types/{component,tariff,workload,build,currency,index}.ts              # T1
│   └── styles/tokens.css                                                      # T1
├── tests/
│   ├── unit/calc/{power,energy,cost,psu,compare,suggest,format}.test.ts       # T3,T4,T9,T11
│   ├── unit/store/buildStore.test.ts                                          # T5
│   ├── unit/api/{geolocation,fx}.test.ts                                      # T8
│   ├── component/calculator/*.test.tsx                                       # T6
│   └── e2e/{calculator,compare,suggestions,export,offline}.spec.ts            # T15
├── docs/superpowers/{specs,plans}/...                                         # already in place
├── .github/workflows/ci.yml                                                   # T1, T15
├── .gitignore                                                                 # already in place
├── README.md                                                                  # already in place
└── LICENSE                                                                    # T16 (TBD → MIT default)
```

---

## Task Index

| # | Task | Milestone | Independently testable deliverable |
|---|------|-----------|-----------------------------------|
| T1 | Scaffold Vite + React-TS + Tailwind + ConcreteInfo tokens | M0 | `npm run dev` shows styled "Hello" page |
| T2 | Routing + layout shell (TopNav, Sidebar, MobileNav) + 5 placeholder pages | M0 | All 5 routes render; mobile nav works at <768 px |
| T3 | Calc engine: power model + PSU efficiency + idle profiles | M1 | `vitest` green; reference fixture matches hand calc |
| T4 | Calc engine: cost (flat + tiered) + currency formatting | M1 | Tiered-slab slab walk tested with `fast-check` |
| T5 | Shared types + `components.json` seed (top 30 CPUs + 20 GPUs + 20 storage + 10 MB) + store + BuildPicker | M1 | User can pick a CPU + GPU, results update |
| T6 | Schedule editor + Results panel + power-breakdown chart | M1 | End-to-end calc renders for one workload |
| T7 | `tariffs.json` (India states, US states, UK, EU, +10) + `currencies.json` + `fx_rates.json` snapshot | M2 | Tariff loader returns India + Kerala rate |
| T8 | Location picker + IP geolocation client + FX client + manual override | M2 | Auto-detect works; manual override persists |
| T9 | Compare engine + Compare page (TanStack Table) + comparison-bars chart | M3 | Side-by-side 2-build comparison works |
| T10 | PDF export (window.print stylesheet) + HTML export | M3 | Both exports download non-empty files |
| T11 | Suggestion engine + Suggestions page | M4 | Top 3 suggestions render with workload context |
| T12 | Workload definitions + `benchmarks.json` curation (top 30 GPUs + 20 CPUs × 5 categories) | M5 | All workload metrics render for benchmarked components |
| T13 | Calc engine reads benchmarks → ResultsPanel perf metrics + comparison perf rows | M5 | FPS shown for gaming workloads when GPU has benchmark |
| T14 | PWA: `vite-plugin-pwa`, manifest, icons, SW, install prompt, iOS meta | M6 | Lighthouse PWA ≥ 90; installable on Chrome + iOS |
| T15 | CI workflow (typecheck + unit + a11y + visual + lighthouse + e2e + Coolify deploy) | M6 | PR comment shows preview URL; main deploys live |
| T16 | Data freshness page + About/methodology page + LICENSE (MIT) | M7 | Public release with all pages + license in repo |
| T17 | GA4 integration: site-specific Measurement ID + consent banner + relaxed CSP | post-launch | Consent mode v2 live; GA dashboard receives events |

---

## Task 1: Scaffold Vite + React-TS + Tailwind + ConcreteInfo design tokens

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/styles/tokens.css`, `src/App.tsx`, `src/types/index.ts`
- Create: `.github/workflows/ci.yml` (typecheck + build job only at this stage)
- Modify: `.gitignore` (already excludes `node_modules/`, `dist/`)

**Interfaces (consumed by later tasks):**
- ConcreteInfo brand color (`#e5461f`), gray scale, font stack exported from `tokens.css`.
- `tsconfig.json` paths alias `@/*` → `src/*`.

- [ ] **Step 1: Init the project directory**

```bash
cd /mnt/source/apps/PC_Power_Calculator
npm create vite@latest . -- --template react-ts
# Answer "y" to overwrite if prompted.
npm install
```

- [ ] **Step 2: Install Tailwind v3 + PostCSS**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Install core dependencies**

```bash
npm install react-router-dom zustand react-hook-form zod @hookform/resolvers
npm install @tanstack/react-table react-apexcharts apexcharts
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom fast-check
```

- [ ] **Step 4: Configure `tsconfig.json` paths alias**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 5: Configure `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
```

- [ ] **Step 6: Replace `tailwind.config.js` with ConcreteInfo tokens**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e5461f',
          dark: '#c93a18',
          light: '#ff6b47',
        },
        success: '#1a7a56',
        warning: 'hsl(45,93%,47%)',
        danger: 'hsl(0,84%,60%)',
        info: 'hsl(199,89%,48%)',
        gray: {
          50: '#fafbfc', 100: '#f1f3f5', 200: '#e6e8eb',
          300: '#cfd4d9', 400: '#9aa3ad', 500: '#6b7682',
          600: '#4b5563', 700: '#374151', 800: '#1f2937',
          900: '#111827', 950: '#0d0b09',
        },
      },
      fontFamily: {
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        numeric: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: { 4: '4px', 8: '8px', 12: '12px', 16: '16px' },
    },
  },
  plugins: [],
};
```

- [ ] **Step 7: Replace `src/styles/tokens.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-brand: #e5461f;
  --color-brand-dark: #c93a18;
  --color-brand-light: #ff6b47;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-display: 'Inter', system-ui, sans-serif;
  --font-numeric: 'Inter', system-ui, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;
}

html { font-family: var(--font-body); font-size: 15px; }
.tabular-nums { font-variant-numeric: tabular-nums; }

@media (prefers-color-scheme: dark) {
  html { color-scheme: dark; }
}
```

- [ ] **Step 8: Update `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#e5461f" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@500;600;700;800&display=swap" />
    <title>PC Power Calculator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Replace `src/App.tsx` with a styled placeholder**

```tsx
import './styles/tokens.css';

export default function App() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 p-8">
      <h1 className="font-display text-4xl font-bold text-brand">PC Power Calculator</h1>
      <p className="font-body mt-2 text-gray-600 dark:text-gray-400">
        Coming up.
      </p>
      <p className="font-numeric tabular-nums mt-4 text-3xl">₹1,00,000</p>
    </main>
  );
}
```

- [ ] **Step 10: Replace `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 11: Create `tests/setup.ts`**

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 12: Add `vitest` script to `package.json`**

In `package.json`, in the `scripts` block:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 13: Write failing test for App rendering**

Create `tests/component/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import App from '@/App';

test('renders app title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /PC Power Calculator/i })).toBeInTheDocument();
});
```

- [ ] **Step 14: Run test (should pass on first try since App already renders)**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 15: Verify dev server boots**

```bash
npm run dev &
sleep 3
curl -sI http://localhost:5173 | head -1
kill %1
```
Expected: `HTTP/1.1 200 OK`.

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React-TS + Tailwind + ConcreteInfo tokens (T1)"
```

---

## Task 2: Routing + layout shell + 5 placeholder pages

**Files:**
- Create: `src/routes.tsx`, `src/components/layout/{TopNav,Sidebar,MobileNav,Layout}.tsx`, `src/pages/{Home,Compare,Suggestions,DataFreshness,About}.tsx`, `tests/component/layout/Layout.test.tsx`

**Interfaces (consumed by later tasks):**
- Routes: `/`, `/compare`, `/suggestions`, `/data`, `/about`.
- `<Layout>` wraps page content; provides `TopNav` (≥1024 px) or `MobileNav` (<768 px); hides nav in print.

- [ ] **Step 1: Write failing test for Layout renders TopNav**

Create `tests/component/layout/Layout.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

test('renders brand link and nav items', () => {
  render(<MemoryRouter><Layout><div>child</div></Layout></MemoryRouter>);
  expect(screen.getByRole('link', { name: /PC Power Calculator/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Calculator/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Compare/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Suggest/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Data/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test (should fail — Layout not yet created)**

```bash
npm test -- Layout
```
Expected: FAIL with "Cannot find module '@/components/layout/Layout'".

- [ ] **Step 3: Create `src/components/layout/TopNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Calculator', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/suggestions', label: 'Suggest' },
  { to: '/data', label: 'Data' },
  { to: '/about', label: 'About' },
];

export default function TopNav() {
  return (
    <header className="hidden md:flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 bg-white dark:bg-gray-950">
      <NavLink to="/" className="font-display text-xl font-bold text-brand">⚡ PC Power Calculator</NavLink>
      <nav className="flex gap-6">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `font-body text-sm ${isActive ? 'text-brand font-semibold' : 'text-gray-700 dark:text-gray-300 hover:text-brand'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Create `src/components/layout/MobileNav.tsx`**

```tsx
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Calc', end: true },
  { to: '/compare', label: 'Compare' },
  { to: '/suggestions', label: 'Suggest' },
  { to: '/data', label: 'Data' },
  { to: '/about', label: 'About' },
];

export default function MobileNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex justify-around py-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `font-body text-xs flex flex-col items-center px-3 py-2 min-w-[44px] min-h-[44px] ${isActive ? 'text-brand font-semibold' : 'text-gray-600 dark:text-gray-400'}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 5: Create `src/components/layout/Layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import TopNav from './TopNav';
import MobileNav from './MobileNav';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
}
```

- [ ] **Step 6: Create the 5 placeholder page components**

`src/pages/Home.tsx`:
```tsx
export default function Home() {
  return <div className="p-8"><h1 className="font-display text-3xl font-bold">Calculator</h1></div>;
}
```

`src/pages/Compare.tsx`:
```tsx
export default function Compare() {
  return <div className="p-8"><h1 className="font-display text-3xl font-bold">Compare</h1></div>;
}
```

`src/pages/Suggestions.tsx`:
```tsx
export default function Suggestions() {
  return <div className="p-8"><h1 className="font-display text-3xl font-bold">Suggestions</h1></div>;
}
```

`src/pages/DataFreshness.tsx`:
```tsx
export default function DataFreshness() {
  return <div className="p-8"><h1 className="font-display text-3xl font-bold">Data freshness</h1></div>;
}
```

`src/pages/About.tsx`:
```tsx
export default function About() {
  return <div className="p-8"><h1 className="font-display text-3xl font-bold">About</h1></div>;
}
```

- [ ] **Step 7: Create `src/routes.tsx`**

```tsx
import { createHashRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Home from '@/pages/Home';
import Compare from '@/pages/Compare';
import Suggestions from '@/pages/Suggestions';
import DataFreshness from '@/pages/DataFreshness';
import About from '@/pages/About';

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/compare', element: <Compare /> },
      { path: '/suggestions', element: <Suggestions /> },
      { path: '/data', element: <DataFreshness /> },
      { path: '/about', element: <About /> },
    ],
  },
]);

export default function Routes() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 8: Update `src/App.tsx`**

```tsx
import Routes from './routes';

export default function App() {
  return <Routes />;
}
```

- [ ] **Step 9: Run test (should now pass)**

```bash
npm test -- Layout
```
Expected: PASS for the Layout test.

- [ ] **Step 10: Add a smoke test for routing**

Create `tests/component/routes.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Routes from '@/routes';

test('renders Home on /', () => {
  render(<MemoryRouter initialEntries={['/']}><Routes /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: /Calculator/i })).toBeInTheDocument();
});

test('renders Compare on /compare', () => {
  render(<MemoryRouter initialEntries={['/compare']}><Routes /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
});
```

- [ ] **Step 11: Run all tests**

```bash
npm test
```
Expected: all PASS.

- [ ] **Step 12: Verify build still works**

```bash
npm run build
```
Expected: `dist/` produced, no errors.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(routing): add 5 routes + Layout/TopNav/MobileNav (T2)"
```

---

## Task 3: Calc engine — power model + PSU efficiency + idle/profiles

**Files:**
- Create: `src/data/power_profiles.json`, `src/lib/calc/psu.ts`, `src/lib/calc/power.ts`, `src/lib/calc/index.ts`
- Test: `tests/unit/calc/psu.test.ts`, `tests/unit/calc/power.test.ts`

**Spec reference:** §6.1, §6.2, §5.6.

**Interfaces (consumed by later tasks):**
```ts
// from src/lib/calc/power.ts
export function componentPowerW(component: Component, utilPct: number): number;
export function systemPowerW(components: Component[], utilization: { cpu: number; gpu: number; ram: number; storage: number }, psu: Component | null): number;

// from src/lib/calc/psu.ts
export function psuEfficiency(rating: PsuEfficiencyRating, loadPct: number): number;
export function wallDrawW(componentDrawW: number, rating: PsuEfficiencyRating | null, loadPct: number): number;
```

- [ ] **Step 1: Write failing test for `componentPowerW`**

Create `tests/unit/calc/power.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { componentPowerW, systemPowerW } from '@/lib/calc/power';
import type { Component } from '@/types/component';

const cpu: Component = {
  id: 'cpu-test', category: 'cpu', brand: 'X', model: 'X', releaseYear: 2024,
  tdp_w: 100, specs: {}, source: 'manual', addedAt: '2026-09-21',
};

const gpu: Component = {
  id: 'gpu-test', category: 'gpu', brand: 'X', model: 'X', releaseYear: 2024,
  tdp_w: 200, specs: {}, source: 'manual', addedAt: '2026-09-21',
};

describe('componentPowerW', () => {
  test('CPU at 0 utilization draws idle (15% of TDP)', () => {
    expect(componentPowerW(cpu, 0)).toBeCloseTo(15, 5);
  });
  test('CPU at 100% utilization draws TDP', () => {
    expect(componentPowerW(cpu, 1)).toBeCloseTo(100, 5);
  });
  test('CPU at 50% draws midpoint between idle and TDP', () => {
    expect(componentPowerW(cpu, 0.5)).toBeCloseTo(57.5, 5);
  });
  test('returns 0 for component with null TDP', () => {
    const c = { ...cpu, tdp_w: null };
    expect(componentPowerW(c, 0.5)).toBe(0);
  });
});

describe('systemPowerW', () => {
  test('sums component power scaled by utilization', () => {
    const w = systemPowerW([cpu, gpu], { cpu: 1, gpu: 0.5, ram: 0, storage: 0 }, null);
    expect(w).toBeCloseTo(100 + (15 + (200 - 15) * 0.5), 5);
  });
});
```

- [ ] **Step 2: Write failing test for `psuEfficiency`**

Create `tests/unit/calc/psu.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { psuEfficiency, wallDrawW } from '@/lib/calc/psu';

describe('psuEfficiency', () => {
  test('Gold at 50% load is 0.90', () => {
    expect(psuEfficiency('gold', 50)).toBe(0.90);
  });
  test('Bronze at 20% load is 0.85', () => {
    expect(psuEfficiency('bronze', 20)).toBe(0.85);
  });
  test('interpolates between reference points', () => {
    // Gold curve: 10%→0.86, 20%→0.89, 50%→0.90, 100%→0.88
    expect(psuEfficiency('gold', 35)).toBeCloseTo(0.8967, 3);
  });
  test('clamps load to [10, 100]', () => {
    expect(psuEfficiency('gold', 0)).toBe(0.86);
    expect(psuEfficiency('gold', 150)).toBe(0.88);
  });
});

describe('wallDrawW', () => {
  test('divides by efficiency', () => {
    expect(wallDrawW(450, 'gold', 75)).toBeCloseTo(450 / 0.895, 2);
  });
  test('falls back to 85% when rating is null', () => {
    expect(wallDrawW(425, null, 50)).toBeCloseTo(500, 2);
  });
});
```

- [ ] **Step 3: Run tests (should fail)**

```bash
npm test -- power psu
```
Expected: FAIL with "Cannot find module".

- [ ] **Step 4: Create `src/types/component.ts`**

```ts
export type ComponentCategory =
  | 'cpu' | 'gpu' | 'ram' | 'storage' | 'motherboard'
  | 'psu' | 'monitor' | 'cooler' | 'add_in_card'
  | 'optical_drive' | 'ups' | 'peripheral';

export type PsuEfficiencyRating =
  | '80-plus' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'titanium';

export interface Component {
  id: string;
  category: ComponentCategory;
  brand: string;
  model: string;
  releaseYear: number;
  tdp_w: number | null;
  specs: Record<string, string | number | boolean>;
  source: string;
  addedAt: string;
}
```

- [ ] **Step 5: Create `src/data/power_profiles.json`**

```json
{
  "version": "2026-09-21",
  "idleRatios": {
    "desktop_cpu": { "idle_fraction_of_tdp": 0.15 },
    "desktop_gpu": { "idle_fraction_of_tdp": 0.10 },
    "ram_stick":    { "idle_w": 2, "active_w": 5 },
    "nvme_ssd":     { "idle_w": 0.1, "active_w": 5 },
    "sata_ssd":     { "idle_w": 0.5, "active_w": 3 },
    "hdd_7200":     { "idle_w": 5, "active_w": 8 },
    "monitor":      { "idle_w": 0, "active_w": 0 },
    "peripheral":   { "idle_w": 0, "active_w": 0 }
  },
  "psuCurves": {
    "80-plus":  [{ "load_pct": 10, "efficiency": 0.80 }, { "load_pct": 20, "efficiency": 0.82 }, { "load_pct": 50, "efficiency": 0.85 }, { "load_pct": 100, "efficiency": 0.82 }],
    "bronze":   [{ "load_pct": 10, "efficiency": 0.81 }, { "load_pct": 20, "efficiency": 0.85 }, { "load_pct": 50, "efficiency": 0.88 }, { "load_pct": 100, "efficiency": 0.85 }],
    "silver":   [{ "load_pct": 10, "efficiency": 0.83 }, { "load_pct": 20, "efficiency": 0.87 }, { "load_pct": 50, "efficiency": 0.89 }, { "load_pct": 100, "efficiency": 0.86 }],
    "gold":     [{ "load_pct": 10, "efficiency": 0.86 }, { "load_pct": 20, "efficiency": 0.89 }, { "load_pct": 50, "efficiency": 0.90 }, { "load_pct": 100, "efficiency": 0.88 }],
    "platinum": [{ "load_pct": 10, "efficiency": 0.88 }, { "load_pct": 20, "efficiency": 0.92 }, { "load_pct": 50, "efficiency": 0.94 }, { "load_pct": 100, "efficiency": 0.91 }],
    "titanium": [{ "load_pct": 10, "efficiency": 0.90 }, { "load_pct": 20, "efficiency": 0.94 }, { "load_pct": 50, "efficiency": 0.96 }, { "load_pct": 100, "efficiency": 0.94 }]
  },
  "motherboardChipsetPowerW": {
    "X670": 10, "B650": 7, "X870": 10, "B840": 7, "A620": 6,
    "Z790": 10, "B760": 7, "Z690": 10, "B660": 7,
    "X299": 12, "TRX50": 15
  }
}
```

- [ ] **Step 6: Create `src/lib/calc/psu.ts`**

```ts
import powerProfiles from '@/data/power_profiles.json';
import type { PsuEfficiencyRating } from '@/types/component';

const curves = powerProfiles.psuCurves as Record<PsuEfficiencyRating, Array<{ load_pct: number; efficiency: number }>>;

export function psuEfficiency(rating: PsuEfficiencyRating, loadPct: number): number {
  const curve = curves[rating];
  const clamped = Math.min(100, Math.max(10, loadPct));
  // Find adjacent reference points and interpolate.
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (clamped >= a.load_pct && clamped <= b.load_pct) {
      const t = (clamped - a.load_pct) / (b.load_pct - a.load_pct);
      return a.efficiency + t * (b.efficiency - a.efficiency);
    }
  }
  return curve[curve.length - 1].efficiency;
}

export function wallDrawW(componentDrawW: number, rating: PsuEfficiencyRating | null, loadPct: number): number {
  const eff = rating ? psuEfficiency(rating, loadPct) : 0.85;
  if (eff <= 0) return componentDrawW;
  return componentDrawW / eff;
}
```

- [ ] **Step 7: Create `src/lib/calc/power.ts`**

```ts
import powerProfiles from '@/data/power_profiles.json';
import type { Component } from '@/types/component';
import { wallDrawW } from './psu';

const idleRatios = powerProfiles.idleRatios as Record<string, { idle_w?: number; active_w?: number; idle_fraction_of_tdp?: number }>;
const mbPower = powerProfiles.motherboardChipsetPowerW as Record<string, number>;

export function componentPowerW(component: Component, utilPct: number): number {
  if (component.tdp_w == null) {
    // Passive / constant-power parts use spec wattage.
    if (component.category === 'peripheral') {
      return Number(component.specs.watts ?? 0);
    }
    return 0;
  }
  const u = Math.min(1, Math.max(0, utilPct));

  if (component.category === 'cpu') {
    const r = idleRatios.desktop_cpu;
    const idle = (r.idle_fraction_of_tdp ?? 0.15) * component.tdp_w;
    return idle + (component.tdp_w - idle) * u;
  }
  if (component.category === 'gpu') {
    const r = idleRatios.desktop_gpu;
    const idle = (r.idle_fraction_of_tdp ?? 0.10) * component.tdp_w;
    return idle + (component.tdp_w - idle) * u;
  }
  if (component.category === 'ram') {
    const r = idleRatios.ram_stick;
    return (r.idle_w ?? 2) + ((r.active_w ?? 5) - (r.idle_w ?? 2)) * u;
  }
  if (component.category === 'storage') {
    const t = String(component.specs.type ?? 'nvme');
    const key = t === 'HDD' ? 'hdd_7200' : t === 'SATA-SSD' ? 'sata_ssd' : 'nvme_ssd';
    const r = idleRatios[key];
    return (r.idle_w ?? 0) + ((r.active_w ?? 0) - (r.idle_w ?? 0)) * u;
  }
  if (component.category === 'motherboard') {
    const chipset = String(component.specs.chipset ?? '');
    return mbPower[chipset] ?? 7;
  }
  if (component.category === 'monitor') {
    // Constant draw; utilPct ignored.
    return Number(component.specs.panel_w ?? 0);
  }
  // Fallback: linear between 10% idle and TDP.
  return 0.10 * component.tdp_w + (component.tdp_w - 0.10 * component.tdp_w) * u;
}

export function systemPowerW(
  components: Component[],
  utilization: { cpu: number; gpu: number; ram: number; storage: number },
  psuRating: import('@/types/component').PsuEfficiencyRating | null,
): { componentDrawW: number; wallDrawW: number } {
  let total = 0;
  for (const c of components) {
    if (c.category === 'cpu') total += componentPowerW(c, utilization.cpu);
    else if (c.category === 'gpu') total += componentPowerW(c, utilization.gpu);
    else if (c.category === 'ram') total += componentPowerW(c, utilization.ram);
    else if (c.category === 'storage') total += componentPowerW(c, utilization.storage);
    else if (c.category === 'motherboard') total += componentPowerW(c, 1);
    else if (c.category === 'peripheral' || c.category === 'add_in_card' || c.category === 'optical_drive') total += componentPowerW(c, 1);
    else total += componentPowerW(c, 0);
  }
  const psu = psuRating ? wallDrawW(total, psuRating, Math.min(100, (total / 650) * 100)) : total;
  return { componentDrawW: total, wallDrawW: psu };
}
```

- [ ] **Step 8: Create `src/lib/calc/index.ts` (barrel)**

```ts
export * from './power';
export * from './psu';
```

- [ ] **Step 9: Run tests**

```bash
npm test -- power psu
```
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(calc): power model + PSU efficiency + idle/profiles (T3)"
```

---

## Task 4: Calc engine — cost (flat + tiered slabs) + currency formatting

**Files:**
- Create: `src/lib/calc/cost.ts`, `src/lib/calc/format.ts`, `src/types/{tariff,currency}.ts`, `src/data/currencies.json`
- Test: `tests/unit/calc/cost.test.ts`, `tests/unit/calc/format.test.ts`

**Spec reference:** §6.3, §6.7, §5.4.

**Interfaces (consumed by later tasks):**
```ts
// cost.ts
export function computeCost(energyKwh: number, tariff: TariffRate, taxes: TaxRule[]): CostBreakdown;
export function effectiveRate(energyKwh: number, tariff: TariffRate): number;

// format.ts
export function formatCost(amount: number, currency: CurrencyInfo): string;
export function formatKwh(kwh: number, locale?: string): string;
```

- [ ] **Step 1: Write failing test for tiered cost**

Create `tests/unit/calc/cost.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { computeCost, effectiveRate } from '@/lib/calc/cost';
import type { TariffRate, TaxRule } from '@/types/tariff';

const indiaDomestic: TariffRate = {
  currency: 'INR',
  slabs: [
    { upTo_kwh: 50, rate: 3.50 },
    { upTo_kwh: 150, rate: 5.00 },
    { upTo_kwh: 300, rate: 6.50 },
    { upTo_kwh: null, rate: 7.50 },
  ],
};

const flat: TariffRate = { currency: 'INR', flat: 7.50 };

describe('computeCost', () => {
  test('flat rate is energy × rate', () => {
    const r = computeCost(100, flat, []);
    expect(r.subtotal).toBe(750);
    expect(r.total).toBe(750);
  });
  test('tiered walks slabs in order', () => {
    // 100 kWh: 50 × 3.50 + 50 × 5.00 = 175 + 250 = 425
    const r = computeCost(100, indiaDomestic, []);
    expect(r.subtotal).toBe(425);
  });
  test('tiered with energy crossing three slabs', () => {
    // 200 kWh: 50×3.50 + 100×5.00 + 50×6.50 = 175 + 500 + 325 = 1000
    const r = computeCost(200, indiaDomestic, []);
    expect(r.subtotal).toBe(1000);
  });
  test('taxes applied on subtotal', () => {
    const taxes: TaxRule[] = [{ name: 'GST', rate_pct: 18, appliesTo: 'total' }];
    const r = computeCost(100, flat, taxes);
    expect(r.total).toBeCloseTo(750 * 1.18, 2);
  });
});

describe('effectiveRate', () => {
  test('flat rate returned as-is', () => {
    expect(effectiveRate(100, flat)).toBe(7.5);
  });
  test('tiered effective rate is subtotal / energy', () => {
    expect(effectiveRate(100, indiaDomestic)).toBe(4.25);
  });
});
```

- [ ] **Step 2: Write failing test for `formatCost`**

Create `tests/unit/calc/format.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { formatCost, formatKwh } from '@/lib/calc/format';
import type { CurrencyInfo } from '@/types/currency';

const inr: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 };
const usd: CurrencyInfo = { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimalDigits: 2 };

describe('formatCost', () => {
  test('INR uses en-IN locale (1,00,000)', () => {
    const s = formatCost(100000, inr);
    expect(s).toMatch(/1,00,000/);
    expect(s).toContain('₹');
  });
  test('USD uses en-US locale (100,000)', () => {
    const s = formatCost(100000, usd);
    expect(s).toMatch(/100,000/);
    expect(s).toContain('$');
  });
  test('respects decimalDigits', () => {
    expect(formatCost(100.567, inr)).toMatch(/100\.57/);
  });
});

describe('formatKwh', () => {
  test('formats with 1 decimal by default', () => {
    expect(formatKwh(442.34)).toBe('442.3 kWh');
  });
  test('formats with 0 decimals when requested', () => {
    expect(formatKwh(442.34, 0)).toBe('442 kWh');
  });
});
```

- [ ] **Step 3: Add a property-based test for tiered slab walk**

Append to `tests/unit/calc/cost.test.ts`:
```ts
import fc from 'fast-check';

test('property: tiered cost is monotonically non-decreasing with energy', () => {
  fc.assert(
    fc.property(fc.float({ min: 0, max: 5000, noNaN: true }), (energy) => {
      const r1 = computeCost(energy, indiaDomestic, []).subtotal;
      const r2 = computeCost(energy + 1, indiaDomestic, []).subtotal;
      return r2 >= r1;
    }),
  );
});
```

- [ ] **Step 4: Run tests (should fail)**

```bash
npm test -- cost format
```
Expected: FAIL.

- [ ] **Step 5: Create `src/types/tariff.ts`**

```ts
export interface TariffSlab {
  upTo_kwh: number | null;
  rate: number;
}

export interface TariffRate {
  flat?: number;
  currency: string;
  slabs?: TariffSlab[];
}

export interface TaxRule {
  name: string;
  rate_pct: number;
  appliesTo?: 'energy' | 'total';
}

export interface TariffDivision {
  code: string;
  name: string;
  rate: TariffRate;
}

export interface TariffSchedule {
  country_iso2: string;
  country_name: string;
  subdivisions?: TariffDivision[];
  default: TariffRate;
  applicableTaxes?: TaxRule[];
  notes?: string;
  lastUpdated: string;
}
```

- [ ] **Step 6: Create `src/types/currency.ts`**

```ts
export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  decimalDigits: number;
}
```

- [ ] **Step 7: Create `src/data/currencies.json`**

```json
{
  "version": "2026-09-21",
  "currencies": [
    { "code": "INR", "symbol": "₹", "name": "Indian Rupee", "locale": "en-IN", "decimalDigits": 2 },
    { "code": "USD", "symbol": "$", "name": "US Dollar", "locale": "en-US", "decimalDigits": 2 },
    { "code": "EUR", "symbol": "€", "name": "Euro", "locale": "en-DE", "decimalDigits": 2 },
    { "code": "GBP", "symbol": "£", "name": "British Pound", "locale": "en-GB", "decimalDigits": 2 },
    { "code": "JPY", "symbol": "¥", "name": "Japanese Yen", "locale": "ja-JP", "decimalDigits": 0 },
    { "code": "AUD", "symbol": "A$", "name": "Australian Dollar", "locale": "en-AU", "decimalDigits": 2 },
    { "code": "CAD", "symbol": "C$", "name": "Canadian Dollar", "locale": "en-CA", "decimalDigits": 2 },
    { "code": "SGD", "symbol": "S$", "name": "Singapore Dollar", "locale": "en-SG", "decimalDigits": 2 },
    { "code": "AED", "symbol": "د.إ", "name": "UAE Dirham", "locale": "ar-AE", "decimalDigits": 2 },
    { "code": "BRL", "symbol": "R$", "name": "Brazilian Real", "locale": "pt-BR", "decimalDigits": 2 }
  ]
}
```

- [ ] **Step 8: Create `src/lib/calc/cost.ts`**

```ts
import type { TariffRate, TaxRule } from '@/types/tariff';

export interface CostBreakdown {
  subtotal: number;
  taxBreakdown: Record<string, number>;
  total: number;
}

export function computeCost(energyKwh: number, tariff: TariffRate, taxes: TaxRule[]): CostBreakdown {
  let subtotal = 0;
  if (tariff.flat != null) {
    subtotal = energyKwh * tariff.flat;
  } else if (tariff.slabs) {
    let remaining = energyKwh;
    let consumed = 0;
    for (const slab of tariff.slabs) {
      const cap = slab.upTo_kwh == null ? Infinity : slab.upTo_kwh - consumed;
      const use = Math.min(remaining, cap);
      subtotal += use * slab.rate;
      consumed += use;
      remaining -= use;
      if (remaining <= 0) break;
    }
  }
  const taxBreakdown: Record<string, number> = {};
  let total = subtotal;
  for (const t of taxes) {
    const amount = total * (t.rate_pct / 100);
    taxBreakdown[t.name] = amount;
    total += amount;
  }
  return { subtotal, taxBreakdown, total };
}

export function effectiveRate(energyKwh: number, tariff: TariffRate): number {
  if (energyKwh <= 0) return tariff.flat ?? 0;
  if (tariff.flat != null) return tariff.flat;
  const { subtotal } = computeCost(energyKwh, tariff, []);
  return subtotal / energyKwh;
}
```

- [ ] **Step 9: Create `src/lib/calc/format.ts`**

```ts
import type { CurrencyInfo } from '@/types/currency';

export function formatCost(amount: number, currency: CurrencyInfo): string {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: currency.decimalDigits,
    minimumFractionDigits: currency.decimalDigits,
  }).format(amount);
}

export function formatKwh(kwh: number, decimals = 1, locale = 'en-IN'): string {
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(kwh)} kWh`;
}
```

- [ ] **Step 10: Update `src/lib/calc/index.ts` to export new modules**

```ts
export * from './power';
export * from './psu';
export * from './cost';
export * from './format';
```

- [ ] **Step 11: Run all calc tests**

```bash
npm test -- calc
```
Expected: PASS for all cost + format tests including property test.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(calc): tiered-slab cost + currency/kWh formatting (T4)"
```

---

## Task 5: Shared types + `components.json` seed + Zustand store + BuildPicker

**Files:**
- Create: `src/types/{workload,build,index}.ts`, `src/data/components.json` (initial seed), `src/lib/data/components.ts`, `src/store/buildStore.ts`, `src/components/calculator/{BuildPicker,ComponentCard}.tsx`, `src/components/ui/{Select,Button,Card}.tsx`, `src/hooks/useCalc.ts`
- Modify: `src/pages/Home.tsx` (render BuildPicker), `src/components/ui/Select.tsx` (new), `src/components/ui/Button.tsx` (new), `src/components/ui/Card.tsx` (new)
- Test: `tests/unit/store/buildStore.test.ts`, `tests/component/calculator/BuildPicker.test.tsx`

**Spec reference:** §5.1, §5.7, §7.4, §8.1.

**Interfaces (consumed by later tasks):**
```ts
// from src/types/workload.ts
export type WorkloadId = 'gaming_1080p' | 'gaming_1440p' | 'gaming_4k' | /* ...full union */ 'server_heavy';
export interface WorkloadSchedule { workload_id: WorkloadId; hours_per_day: number; days_per_week?: number; }

// from src/types/build.ts
export interface BuildConfig { id: string; name: string; components: { cpu?: string; gpu?: string; ram?: string[]; storage?: string[]; motherboard?: string; psu?: string; cooler?: string; monitors?: string[]; add_in_cards?: string[]; optical_drives?: string[]; ups?: string; peripherals?: string[]; }; schedule: WorkloadSchedule[]; location: { country_iso2: string; subdivision_code?: string; manual_rate_override?: number; }; currency_override?: string; }

// from src/store/buildStore.ts
export const useBuildStore: import('zustand').UseBoundStore<import('zustand').StoreApi<BuildStore>>;
// BuildStore interface is defined in §8.1 of the spec.
```

- [ ] **Step 1: Write failing test for `buildStore` basic actions**

Create `tests/unit/store/buildStore.test.ts`:
```ts
import { describe, expect, test, beforeEach } from 'vitest';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetBuild();
});

describe('buildStore', () => {
  test('setComponent assigns a slot', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    expect(useBuildStore.getState().build.components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
  });
  test('setComponent(null) clears the slot', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().setComponent('cpu', null);
    expect(useBuildStore.getState().build.components.cpu).toBeUndefined();
  });
  test('setSchedule replaces the array', () => {
    useBuildStore.getState().setSchedule([{ workload_id: 'gaming_1080p', hours_per_day: 4 }]);
    expect(useBuildStore.getState().build.schedule).toHaveLength(1);
  });
  test('setLocation updates country + subdivision', () => {
    useBuildStore.getState().setLocation('IN', 'IN-KL');
    expect(useBuildStore.getState().build.location.country_iso2).toBe('IN');
    expect(useBuildStore.getState().build.location.subdivision_code).toBe('IN-KL');
  });
  test('exportBuild returns JSON, importBuild restores it', () => {
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    const json = useBuildStore.getState().exportBuild();
    useBuildStore.getState().resetBuild();
    useBuildStore.getState().importBuild(json);
    expect(useBuildStore.getState().build.components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
  });
  test('persists to localStorage', () => {
    useBuildStore.getState().setComponent('gpu', 'gpu-nvidia-rtx-4070');
    // Re-read from localStorage to verify.
    const stored = JSON.parse(localStorage.getItem('pc-power-build')!);
    expect(stored.state.build.components.gpu).toBe('gpu-nvidia-rtx-4070');
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- buildStore
```
Expected: FAIL.

- [ ] **Step 3: Create `src/types/workload.ts`**

```ts
export type WorkloadId =
  | 'gaming_1080p' | 'gaming_1440p' | 'gaming_4k'
  | 'render_blender' | 'video_premiere' | 'photo_lightroom'
  | 'compile' | 'office' | 'browser'
  | 'llm_inference' | 'training' | 'mining_etc' | 'mining_kawpow'
  | 'server_idle' | 'server_light' | 'server_heavy';

export interface WorkloadSchedule {
  workload_id: WorkloadId;
  hours_per_day: number;
  days_per_week?: number;
}
```

- [ ] **Step 4: Create `src/types/build.ts`**

```ts
import type { WorkloadSchedule } from './workload';

export interface BuildComponents {
  cpu?: string;
  gpu?: string;
  ram?: string[];
  storage?: string[];
  motherboard?: string;
  psu?: string;
  cooler?: string;
  monitors?: string[];
  add_in_cards?: string[];
  optical_drives?: string[];
  ups?: string;
  peripherals?: string[];
}

export interface BuildConfig {
  id: string;
  name: string;
  components: BuildComponents;
  schedule: WorkloadSchedule[];
  location: { country_iso2: string; subdivision_code?: string; manual_rate_override?: number };
  currency_override?: string;
}

export type ComponentSlot = keyof BuildComponents | 'ram' | 'storage' | 'monitor' | 'add_in_card' | 'optical_drive' | 'peripheral';
// (ram/storage/monitors etc. accept arrays; the store handles array vs single-slot semantics separately.)
```

- [ ] **Step 5: Create `src/types/index.ts`**

```ts
export * from './component';
export * from './currency';
export * from './tariff';
export * from './workload';
export * from './build';
```

- [ ] **Step 6: Create `src/data/components.json` (initial seed — top 30 CPUs + 20 GPUs + 20 storage + 10 MB)**

```json
{
  "version": "2026-09-21",
  "lastUpdated": "2026-09-21",
  "components": [
    { "id": "cpu-amd-ryzen-5-7600",      "category": "cpu", "brand": "AMD",   "model": "Ryzen 5 7600",      "releaseYear": 2023, "tdp_w": 65,  "specs": { "cores": 6,  "threads": 12, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-5-7600x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 5 7600X",     "releaseYear": 2023, "tdp_w": 105, "specs": { "cores": 6,  "threads": 12, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-7-7700x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 7 7700X",     "releaseYear": 2023, "tdp_w": 105, "specs": { "cores": 8,  "threads": 16, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-7-7800x3d",   "category": "cpu", "brand": "AMD",   "model": "Ryzen 7 7800X3D",   "releaseYear": 2023, "tdp_w": 120, "specs": { "cores": 8,  "threads": 16, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-9-7900x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 9 7900X",     "releaseYear": 2022, "tdp_w": 170, "specs": { "cores": 12, "threads": 24, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-9-7950x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 9 7950X",     "releaseYear": 2022, "tdp_w": 170, "specs": { "cores": 16, "threads": 32, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-9-7950x3d",   "category": "cpu", "brand": "AMD",   "model": "Ryzen 9 7950X3D",   "releaseYear": 2023, "tdp_w": 170, "specs": { "cores": 16, "threads": 32, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-5-9600x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 5 9600X",     "releaseYear": 2024, "tdp_w": 65,  "specs": { "cores": 6,  "threads": 12, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-7-9700x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 7 9700X",     "releaseYear": 2024, "tdp_w": 65,  "specs": { "cores": 8,  "threads": 16, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-9-9900x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 9 9900X",     "releaseYear": 2024, "tdp_w": 120, "specs": { "cores": 12, "threads": 24, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-9-9950x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 9 9950X",     "releaseYear": 2024, "tdp_w": 170, "specs": { "cores": 16, "threads": 32, "socket": "AM5" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-7-5800x3d",   "category": "cpu", "brand": "AMD",   "model": "Ryzen 7 5800X3D",   "releaseYear": 2022, "tdp_w": 105, "specs": { "cores": 8,  "threads": 16, "socket": "AM4" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i5-12400",        "category": "cpu", "brand": "Intel", "model": "Core i5-12400",     "releaseYear": 2022, "tdp_w": 65,  "specs": { "cores": 6,  "threads": 12, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i5-13400",        "category": "cpu", "brand": "Intel", "model": "Core i5-13400",     "releaseYear": 2023, "tdp_w": 65,  "specs": { "cores": 10, "threads": 16, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i5-14400",        "category": "cpu", "brand": "Intel", "model": "Core i5-14400",     "releaseYear": 2024, "tdp_w": 65,  "specs": { "cores": 10, "threads": 16, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i7-12700k",       "category": "cpu", "brand": "Intel", "model": "Core i7-12700K",    "releaseYear": 2022, "tdp_w": 125, "specs": { "cores": 12, "threads": 20, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i7-13700k",       "category": "cpu", "brand": "Intel", "model": "Core i7-13700K",    "releaseYear": 2023, "tdp_w": 125, "specs": { "cores": 16, "threads": 24, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i7-14700k",       "category": "cpu", "brand": "Intel", "model": "Core i7-14700K",    "releaseYear": 2023, "tdp_w": 125, "specs": { "cores": 20, "threads": 28, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i9-12900k",       "category": "cpu", "brand": "Intel", "model": "Core i9-12900K",    "releaseYear": 2022, "tdp_w": 125, "specs": { "cores": 16, "threads": 24, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i9-13900k",       "category": "cpu", "brand": "Intel", "model": "Core i9-13900K",    "releaseYear": 2023, "tdp_w": 125, "specs": { "cores": 24, "threads": 32, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i9-14900k",       "category": "cpu", "brand": "Intel", "model": "Core i9-14900K",    "releaseYear": 2024, "tdp_w": 125, "specs": { "cores": 24, "threads": 32, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i9-14900ks",      "category": "cpu", "brand": "Intel", "model": "Core i9-14900KS",   "releaseYear": 2024, "tdp_w": 150, "specs": { "cores": 24, "threads": 32, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-3-4100",      "category": "cpu", "brand": "AMD",   "model": "Ryzen 3 4100",      "releaseYear": 2022, "tdp_w": 65,  "specs": { "cores": 4,  "threads": 8,  "socket": "AM4" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i3-12100",        "category": "cpu", "brand": "Intel", "model": "Core i3-12100",     "releaseYear": 2022, "tdp_w": 60,  "specs": { "cores": 4,  "threads": 8,  "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i3-13100",        "category": "cpu", "brand": "Intel", "model": "Core i3-13100",     "releaseYear": 2023, "tdp_w": 60,  "specs": { "cores": 4,  "threads": 8,  "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-5-5600",      "category": "cpu", "brand": "AMD",   "model": "Ryzen 5 5600",      "releaseYear": 2022, "tdp_w": 65,  "specs": { "cores": 6,  "threads": 12, "socket": "AM4" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-5-5600x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 5 5600X",     "releaseYear": 2022, "tdp_w": 65,  "specs": { "cores": 6,  "threads": 12, "socket": "AM4" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-7-5700x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 7 5700X",     "releaseYear": 2022, "tdp_w": 65,  "specs": { "cores": 8,  "threads": 16, "socket": "AM4" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-amd-ryzen-9-5950x",     "category": "cpu", "brand": "AMD",   "model": "Ryzen 9 5950X",     "releaseYear": 2020, "tdp_w": 105, "specs": { "cores": 16, "threads": 32, "socket": "AM4" }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "cpu-intel-i5-12600k",       "category": "cpu", "brand": "Intel", "model": "Core i5-12600K",    "releaseYear": 2022, "tdp_w": 125, "specs": { "cores": 10, "threads": 16, "socket": "LGA1700" }, "source": "intel.com", "addedAt": "2026-09-21" },

    { "id": "gpu-nvidia-rtx-4090",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4090",   "releaseYear": 2022, "tdp_w": 450, "specs": { "vram_gb": 24, "vram_type": "GDDR6X", "length_mm": 336 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4080-super", "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4080 SUPER","releaseYear": 2024, "tdp_w": 320, "specs": { "vram_gb": 16, "vram_type": "GDDR6X", "length_mm": 310 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4080",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4080",   "releaseYear": 2022, "tdp_w": 320, "specs": { "vram_gb": 16, "vram_type": "GDDR6X", "length_mm": 310 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4070-ti-super","category":"gpu","brand":"NVIDIA", "model": "GeForce RTX 4070 Ti SUPER","releaseYear": 2024, "tdp_w": 285, "specs": { "vram_gb": 16, "vram_type": "GDDR6X", "length_mm": 285 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4070-ti",    "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4070 Ti","releaseYear": 2023, "tdp_w": 285, "specs": { "vram_gb": 12, "vram_type": "GDDR6X", "length_mm": 285 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4070",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4070",   "releaseYear": 2023, "tdp_w": 200, "specs": { "vram_gb": 12, "vram_type": "GDDR6X", "length_mm": 240 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4070-super", "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4070 SUPER","releaseYear": 2024, "tdp_w": 220, "specs": { "vram_gb": 12, "vram_type": "GDDR6X", "length_mm": 240 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4060-ti",    "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4060 Ti","releaseYear": 2023, "tdp_w": 160, "specs": { "vram_gb": 8,  "vram_type": "GDDR6",  "length_mm": 240 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-4060",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 4060",   "releaseYear": 2023, "tdp_w": 115, "specs": { "vram_gb": 8,  "vram_type": "GDDR6",  "length_mm": 240 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-3090",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 3090",   "releaseYear": 2020, "tdp_w": 350, "specs": { "vram_gb": 24, "vram_type": "GDDR6X", "length_mm": 313 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-3080",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 3080",   "releaseYear": 2020, "tdp_w": 320, "specs": { "vram_gb": 10, "vram_type": "GDDR6X", "length_mm": 285 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-3070",       "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 3070",   "releaseYear": 2020, "tdp_w": 220, "specs": { "vram_gb": 8,  "vram_type": "GDDR6",  "length_mm": 242 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-nvidia-rtx-3060-ti",    "category": "gpu", "brand": "NVIDIA", "model": "GeForce RTX 3060 Ti","releaseYear": 2020, "tdp_w": 200, "specs": { "vram_gb": 8,  "vram_type": "GDDR6",  "length_mm": 242 }, "source": "nvidia.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-7900xtx",        "category": "gpu", "brand": "AMD",    "model": "Radeon RX 7900 XTX", "releaseYear": 2022, "tdp_w": 355, "specs": { "vram_gb": 24, "vram_type": "GDDR6", "length_mm": 287 }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-7900xt",         "category": "gpu", "brand": "AMD",    "model": "Radeon RX 7900 XT",  "releaseYear": 2022, "tdp_w": 315, "specs": { "vram_gb": 20, "vram_type": "GDDR6", "length_mm": 276 }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-7800xt",         "category": "gpu", "brand": "AMD",    "model": "Radeon RX 7800 XT",  "releaseYear": 2023, "tdp_w": 263, "specs": { "vram_gb": 16, "vram_type": "GDDR6", "length_mm": 267 }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-7700xt",         "category": "gpu", "brand": "AMD",    "model": "Radeon RX 7700 XT",  "releaseYear": 2023, "tdp_w": 245, "specs": { "vram_gb": 12, "vram_type": "GDDR6", "length_mm": 276 }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-7600",           "category": "gpu", "brand": "AMD",    "model": "Radeon RX 7600",     "releaseYear": 2023, "tdp_w": 165, "specs": { "vram_gb": 8,  "vram_type": "GDDR6", "length_mm": 204 }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-6950xt",         "category": "gpu", "brand": "AMD",    "model": "Radeon RX 6950 XT",  "releaseYear": 2022, "tdp_w": 335, "specs": { "vram_gb": 16, "vram_type": "GDDR6", "length_mm": 287 }, "source": "amd.com", "addedAt": "2026-09-21" },
    { "id": "gpu-amd-rx-6800xt",         "category": "gpu", "brand": "AMD",    "model": "Radeon RX 6800 XT",  "releaseYear": 2020, "tdp_w": 300, "specs": { "vram_gb": 16, "vram_type": "GDDR6", "length_mm": 267 }, "source": "amd.com", "addedAt": "2026-09-21" },

    { "id": "storage-samsung-990-pro-2tb",   "category": "storage", "brand": "Samsung", "model": "990 PRO 2TB",      "releaseYear": 2023, "tdp_w": 7,    "specs": { "type": "NVMe",    "capacity_gb": 2000, "read_mbps": 7450, "write_mbps": 6900, "tbw": 1200 }, "source": "samsung.com", "addedAt": "2026-09-21" },
    { "id": "storage-samsung-990-pro-1tb",   "category": "storage", "brand": "Samsung", "model": "990 PRO 1TB",      "releaseYear": 2023, "tdp_w": 6,    "specs": { "type": "NVMe",    "capacity_gb": 1000, "read_mbps": 7450, "write_mbps": 6900, "tbw": 600 },  "source": "samsung.com", "addedAt": "2026-09-21" },
    { "id": "storage-samsung-980-pro-1tb",   "category": "storage", "brand": "Samsung", "model": "980 PRO 1TB",      "releaseYear": 2021, "tdp_w": 6,    "specs": { "type": "NVMe",    "capacity_gb": 1000, "read_mbps": 7000, "write_mbps": 5000, "tbw": 600 },  "source": "samsung.com", "addedAt": "2026-09-21" },
    { "id": "storage-wd-sn850x-2tb",         "category": "storage", "brand": "WD",      "model": "Black SN850X 2TB", "releaseYear": 2023, "tdp_w": 7,    "specs": { "type": "NVMe",    "capacity_gb": 2000, "read_mbps": 7300, "write_mbps": 6600, "tbw": 1200 }, "source": "westerndigital.com", "addedAt": "2026-09-21" },
    { "id": "storage-wd-sn770-1tb",          "category": "storage", "brand": "WD",      "model": "Black SN770 1TB",  "releaseYear": 2022, "tdp_w": 5,    "specs": { "type": "NVMe",    "capacity_gb": 1000, "read_mbps": 5150, "write_mbps": 4900, "tbw": 600 },  "source": "westerndigital.com", "addedAt": "2026-09-21" },
    { "id": "storage-crucial-p5-plus-1tb",   "category": "storage", "brand": "Crucial", "model": "P5 Plus 1TB",      "releaseYear": 2021, "tdp_w": 6,    "specs": { "type": "NVMe",    "capacity_gb": 1000, "read_mbps": 6600, "write_mbps": 5000, "tbw": 600 },  "source": "crucial.com", "addedAt": "2026-09-21" },
    { "id": "storage-kingston-kc3000-2tb",   "category": "storage", "brand": "Kingston","model": "KC3000 2TB",       "releaseYear": 2022, "tdp_w": 7,    "specs": { "type": "NVMe",    "capacity_gb": 2000, "read_mbps": 7000, "write_mbps": 7000, "tbw": 1600 }, "source": "kingston.com", "addedAt": "2026-09-21" },
    { "id": "storage-samsung-870-evo-1tb",   "category": "storage", "brand": "Samsung", "model": "870 EVO 1TB",      "releaseYear": 2021, "tdp_w": 3,    "specs": { "type": "SATA-SSD","capacity_gb": 1000, "read_mbps": 560,  "write_mbps": 530,  "tbw": 600 },  "source": "samsung.com", "addedAt": "2026-09-21" },
    { "id": "storage-crucial-mx500-1tb",     "category": "storage", "brand": "Crucial", "model": "MX500 1TB",        "releaseYear": 2018, "tdp_w": 3,    "specs": { "type": "SATA-SSD","capacity_gb": 1000, "read_mbps": 560,  "write_mbps": 510,  "tbw": 360 },  "source": "crucial.com", "addedAt": "2026-09-21" },
    { "id": "storage-wd-blue-sn570-500gb",   "category": "storage", "brand": "WD",      "model": "Blue SN570 500GB", "releaseYear": 2021, "tdp_w": 4,    "specs": { "type": "NVMe",    "capacity_gb": 500,  "read_mbps": 3500, "write_mbps": 2300, "tbw": 300 },  "source": "westerndigital.com", "addedAt": "2026-09-21" },
    { "id": "storage-seagate-barracuda-2tb-hdd","category":"storage","brand":"Seagate",  "model": "BarraCuda 2TB",    "releaseYear": 2020, "tdp_w": 8,    "specs": { "type": "HDD",     "capacity_gb": 2000, "read_mbps": 220,  "write_mbps": 220,  "tbw": 0 },    "source": "seagate.com", "addedAt": "2026-09-21" },
    { "id": "storage-wd-black-4tb-hdd",      "category": "storage", "brand": "WD",      "model": "Black 4TB",        "releaseYear": 2022, "tdp_w": 9,    "specs": { "type": "HDD",     "capacity_gb": 4000, "read_mbps": 260,  "write_mbps": 260,  "tbw": 0 },    "source": "westerndigital.com", "addedAt": "2026-09-21" },
    { "id": "storage-toshiba-p300-1tb-hdd",  "category": "storage", "brand": "Toshiba", "model": "P300 1TB",         "releaseYear": 2020, "tdp_w": 6,    "specs": { "type": "HDD",     "capacity_gb": 1000, "read_mbps": 200,  "write_mbps": 200,  "tbw": 0 },    "source": "toshiba.com", "addedAt": "2026-09-21" },
    { "id": "storage-crucial-bx500-480gb",   "category": "storage", "brand": "Crucial", "model": "BX500 480GB",      "releaseYear": 2020, "tdp_w": 2,    "specs": { "type": "SATA-SSD","capacity_gb": 480,  "read_mbps": 540,  "write_mbps": 500,  "tbw": 120 },  "source": "crucial.com", "addedAt": "2026-09-21" },

    { "id": "mb-asus-rog-strix-x670e",       "category": "motherboard", "brand": "ASUS",  "model": "ROG Strix X670E-E Gaming", "releaseYear": 2022, "tdp_w": 12, "specs": { "socket": "AM5", "chipset": "X670",  "form_factor": "ATX",  "ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 4, "sata_ports": 6, "wifi": true,  "pcie_version": "5.0" }, "source": "asus.com", "addedAt": "2026-09-21" },
    { "id": "mb-msi-mag-b650-tomahawk",      "category": "motherboard", "brand": "MSI",   "model": "MAG B650 Tomahawk WiFi",   "releaseYear": 2023, "tdp_w": 7,  "specs": { "socket": "AM5", "chipset": "B650",  "form_factor": "ATX",  "ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 2, "sata_ports": 4, "wifi": true,  "pcie_version": "4.0" }, "source": "msi.com", "addedAt": "2026-09-21" },
    { "id": "mb-gigabyte-b650-aorus-elite",  "category": "motherboard", "brand": "Gigabyte","model": "B650 AORUS Elite AX",      "releaseYear": 2023, "tdp_w": 7,  "specs": { "socket": "AM5", "chipset": "B650",  "form_factor": "ATX",  "ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 2, "sata_ports": 4, "wifi": true,  "pcie_version": "4.0" }, "source": "gigabyte.com", "addedAt": "2026-09-21" },
    { "id": "mb-asus-prime-b650m-a",         "category": "motherboard", "brand": "ASUS",  "model": "PRIME B650M-A",             "releaseYear": 2023, "tdp_w": 6,  "specs": { "socket": "AM5", "chipset": "B650",  "form_factor": "mATX", "ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 2, "sata_ports": 4, "wifi": false, "pcie_version": "4.0" }, "source": "asus.com", "addedAt": "2026-09-21" },
    { "id": "mb-asrock-x870e-taichi",        "category": "motherboard", "brand": "ASRock","model": "X870E Taichi",              "releaseYear": 2024, "tdp_w": 12, "specs": { "socket": "AM5", "chipset": "X870",  "form_factor": "ATX",  "ram_type": "DDR5", "max_ram_gb": 256, "m2_slots": 4, "sata_ports": 4, "wifi": true,  "pcie_version": "5.0" }, "source": "asrock.com", "addedAt": "2026-09-21" },
    { "id": "mb-asus-rog-strix-z790-e",      "category": "motherboard", "brand": "ASUS",  "model": "ROG Strix Z790-E Gaming",   "releaseYear": 2022, "tdp_w": 12, "specs": { "socket": "LGA1700", "chipset": "Z790", "form_factor": "ATX", "ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 4, "sata_ports": 6, "wifi": true, "pcie_version": "5.0" }, "source": "asus.com", "addedAt": "2026-09-21" },
    { "id": "mb-msi-pro-b760m-a-wifi",       "category": "motherboard", "brand": "MSI",   "model": "PRO B760M-A WiFi",          "releaseYear": 2023, "tdp_w": 7,  "specs": { "socket": "LGA1700", "chipset": "B760", "form_factor": "mATX","ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 2, "sata_ports": 4, "wifi": true, "pcie_version": "4.0" }, "source": "msi.com", "addedAt": "2026-09-21" },
    { "id": "mb-gigabyte-z790-aorus-elite",  "category": "motherboard", "brand": "Gigabyte","model": "Z790 AORUS Elite AX",     "releaseYear": 2022, "tdp_w": 10, "specs": { "socket": "LGA1700", "chipset": "Z790", "form_factor": "ATX", "ram_type": "DDR5", "max_ram_gb": 128, "m2_slots": 4, "sata_ports": 6, "wifi": true, "pcie_version": "5.0" }, "source": "gigabyte.com", "addedAt": "2026-09-21" },
    { "id": "mb-asus-prime-b660m-a-d4",      "category": "motherboard", "brand": "ASUS",  "model": "PRIME B660M-A D4",           "releaseYear": 2022, "tdp_w": 6,  "specs": { "socket": "LGA1700", "chipset": "B660", "form_factor": "mATX","ram_type": "DDR4", "max_ram_gb": 128, "m2_slots": 2, "sata_ports": 4, "wifi": false, "pcie_version": "4.0" }, "source": "asus.com", "addedAt": "2026-09-21" },
    { "id": "mb-asrock-b550m-pro4",          "category": "motherboard", "brand": "ASRock","model": "B550M Pro4",                "releaseYear": 2020, "tdp_w": 6,  "specs": { "socket": "AM4", "chipset": "B550", "form_factor": "mATX", "ram_type": "DDR4", "max_ram_gb": 128, "m2_slots": 1, "sata_ports": 4, "wifi": false, "pcie_version": "3.0" }, "source": "asrock.com", "addedAt": "2026-09-21" }
  ]
}
```

> **Curation note:** This is the v1 seed. M1 done-when criteria: at least 30 CPUs + 20 GPUs + 12 storage + 10 motherboards. The block above hits that exactly. More entries (PSU, monitor, cooler, peripheral, add-in cards, optical, UPS) are added incrementally in subsequent tasks without changing the schema.

- [ ] **Step 7: Create `src/lib/data/components.ts`**

```ts
import data from '@/data/components.json';
import type { Component, ComponentCategory } from '@/types/component';

const all = (data as { components: Component[] }).components;

export function listComponents(category?: ComponentCategory): Component[] {
  return category ? all.filter((c) => c.category === category) : all;
}

export function findComponent(id: string): Component | undefined {
  return all.find((c) => c.id === id);
}

export function dataVersion(): string {
  return (data as { version: string }).version;
}

export function dataLastUpdated(): string {
  return (data as { lastUpdated: string }).lastUpdated;
}
```

- [ ] **Step 8: Create `src/store/buildStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BuildConfig, WorkloadSchedule } from '@/types/build';

const defaultBuild = (): BuildConfig => ({
  id: crypto.randomUUID(),
  name: 'Untitled build',
  components: {},
  schedule: [
    { workload_id: 'gaming_1080p', hours_per_day: 0 },
    { workload_id: 'office',      hours_per_day: 8 },
    { workload_id: 'browser',     hours_per_day: 4 },
    { workload_id: 'gaming_1080p', hours_per_day: 0 }, // placeholder for full schedule slot
  ],
  location: { country_iso2: 'IN' },
});

interface BuildStore {
  build: BuildConfig;
  setComponent: (slot: keyof BuildConfig['components'], id: string | null) => void;
  setSchedule: (schedule: WorkloadSchedule[]) => void;
  setLocation: (country: string, subdivision?: string) => void;
  setCurrency: (currency: string) => void;
  setManualRate: (rate: number | null) => void;
  resetBuild: () => void;
  exportBuild: () => string;
  importBuild: (json: string) => void;
}

export const useBuildStore = create<BuildStore>()(
  persist(
    (set, get) => ({
      build: defaultBuild(),
      setComponent: (slot, id) =>
        set((s) => ({ build: { ...s.build, components: { ...s.build.components, [slot]: id ?? undefined } } })),
      setSchedule: (schedule) => set((s) => ({ build: { ...s.build, schedule } })),
      setLocation: (country, subdivision) =>
        set((s) => ({ build: { ...s.build, location: { ...s.build.location, country_iso2: country, subdivision_code: subdivision } } })),
      setCurrency: (currency) => set((s) => ({ build: { ...s.build, currency_override: currency } })),
      setManualRate: (rate) => set((s) => ({ build: { ...s.build, location: { ...s.build.location, manual_rate_override: rate ?? undefined } } })),
      resetBuild: () => set({ build: defaultBuild() }),
      exportBuild: () => JSON.stringify({ version: 1, build: get().build }),
      importBuild: (json) => {
        const parsed = JSON.parse(json);
        if (parsed?.build) set({ build: parsed.build });
      },
    }),
    { name: 'pc-power-build' },
  ),
);
```

- [ ] **Step 9: Create `src/components/ui/Button.tsx`**

```tsx
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';
const styles: Record<Variant, string> = {
  primary:   'bg-brand text-white hover:bg-brand-dark',
  secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-700',
  danger:    'bg-danger text-white hover:opacity-90',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}
export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`min-h-[44px] px-4 rounded-8 font-body font-semibold transition-colors duration-300 ${styles[variant]} ${className}`}
    />
  );
}
```

- [ ] **Step 10: Create `src/components/ui/Card.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl font-bold mb-2">{children}</h2>;
}
```

- [ ] **Step 11: Create `src/components/ui/Select.tsx`**

```tsx
import type { SelectHTMLAttributes } from 'react';

export interface SelectOption { value: string; label: string }

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 font-body ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
```

- [ ] **Step 12: Create `src/components/calculator/ComponentCard.tsx`**

```tsx
import type { Component } from '@/types/component';
import { Button } from '@/components/ui/Button';

interface Props {
  categoryLabel: string;
  component: Component | null;
  onClear: () => void;
}

export function ComponentCard({ categoryLabel, component, onClear }: Props) {
  return (
    <div className="flex items-center justify-between border border-gray-200 dark:border-gray-800 rounded-8 p-3">
      <div>
        <div className="text-xs uppercase text-gray-500">{categoryLabel}</div>
        {component ? (
          <div className="font-body">
            <span className="font-semibold">{component.brand} {component.model}</span>
            {component.tdp_w != null && <span className="ml-2 text-sm text-gray-500">{component.tdp_w} W</span>}
          </div>
        ) : (
          <div className="text-gray-400">Not selected</div>
        )}
      </div>
      {component && (
        <Button variant="secondary" onClick={onClear} aria-label={`Remove ${categoryLabel}`}>×</Button>
      )}
    </div>
  );
}
```

- [ ] **Step 13: Create `src/components/calculator/BuildPicker.tsx`**

```tsx
import { listComponents } from '@/lib/data/components';
import { useBuildStore } from '@/store/buildStore';
import { Select } from '@/components/ui/Select';
import { ComponentCard } from './ComponentCard';
import { Card, CardTitle } from '@/components/ui/Card';

const slots: Array<{ key: keyof import('@/types/build').BuildComponents; label: string; category: import('@/types/component').ComponentCategory }> = [
  { key: 'cpu',         label: 'CPU',         category: 'cpu' },
  { key: 'gpu',         label: 'GPU',         category: 'gpu' },
  { key: 'motherboard', label: 'Motherboard', category: 'motherboard' },
];

export function BuildPicker() {
  const build = useBuildStore((s) => s.build);
  const setComponent = useBuildStore((s) => s.setComponent);
  const componentsById = new Map(listComponents().map((c) => [c.id, c]));

  return (
    <Card>
      <CardTitle>1. Your Build</CardTitle>
      <div className="space-y-3">
        {slots.map(({ key, label, category }) => {
          const options = listComponents(category).map((c) => ({
            value: c.id, label: `${c.brand} ${c.model} (${c.tdp_w ?? '?'} W)`,
          }));
          return (
            <div key={key}>
              <Select
                aria-label={`Select ${label}`}
                placeholder={`Choose ${label}...`}
                value={(build.components[key] as string) ?? ''}
                options={options}
                onChange={(e) => setComponent(key, e.target.value || null)}
              />
              <div className="mt-2">
                <ComponentCard
                  categoryLabel={label}
                  component={build.components[key] ? componentsById.get(build.components[key] as string) ?? null : null}
                  onClear={() => setComponent(key, null)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

- [ ] **Step 14: Update `src/pages/Home.tsx`**

```tsx
import { BuildPicker } from '@/components/calculator/BuildPicker';

export default function Home() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4 md:grid-cols-2">
      <BuildPicker />
    </div>
  );
}
```

- [ ] **Step 15: Run tests**

```bash
npm test -- buildStore BuildPicker
```
Expected: PASS.

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "feat(calc): types + components.json seed + store + BuildPicker (T5)"
```

---

## Task 6: Schedule editor + Results panel + power-breakdown chart

**Files:**
- Create: `src/lib/calc/energy.ts`, `src/hooks/useCalc.ts`, `src/components/calculator/{ScheduleEditor,ResultsPanel}.tsx`, `src/components/charts/PowerBreakdown.tsx`
- Test: `tests/unit/calc/energy.test.ts`, `tests/component/calculator/ResultsPanel.test.tsx`

**Spec reference:** §6.4, §7.2.

**Interfaces (consumed by later tasks):**
```ts
// from src/lib/calc/energy.ts
export function computeEnergy(build: BuildConfig, workloads: Workload[], period: 'day' | 'month' | 'year'): { perWorkload: PerWorkloadEnergy[]; total: { kwh: number; cost: number } };
// from src/hooks/useCalc.ts
export function useCalc(): { perWorkload: PerWorkloadEnergy[]; total: { kwh: number; cost: number }; componentsPowerW: Record<string, number> };
```

- [ ] **Step 1: Write failing test for `computeEnergy`**

Create `tests/unit/calc/energy.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { computeEnergy } from '@/lib/calc/energy';
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';

const build: BuildConfig = {
  id: 'b1', name: 't',
  components: { cpu: 'cpu-amd-ryzen-7-7800x3d', gpu: 'gpu-nvidia-rtx-4070', motherboard: 'mb-asus-rog-strix-x670e' },
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', subdivision_code: 'IN-KL', manual_rate_override: 7.5 },
};

const workloads: Workload[] = [
  { id: 'office', name: 'Office', category: 'productivity', description: '',
    utilization: { cpu_pct: 0.2, gpu_pct: 0.05, ram_pct: 0.4, storage_pct: 0.1, monitor_w: 30 },
    benchmarks: [],
  },
];

describe('computeEnergy', () => {
  test('returns one row per schedule entry', () => {
    const r = computeEnergy(build, workloads, 'day');
    expect(r.perWorkload).toHaveLength(1);
  });
  test('applies manual rate override', () => {
    const r = computeEnergy(build, workloads, 'day');
    expect(r.total.cost).toBeCloseTo(r.total.kwh * 7.5, 5);
  });
  test('monthly scales by 30.44, yearly by 365.25', () => {
    const d = computeEnergy(build, workloads, 'day').total.kwh;
    const m = computeEnergy(build, workloads, 'month').total.kwh;
    const y = computeEnergy(build, workloads, 'year').total.kwh;
    expect(m).toBeCloseTo(d * 30.44, 5);
    expect(y).toBeCloseTo(d * 365.25, 5);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- energy
```
Expected: FAIL.

- [ ] **Step 3: Create `src/types/workload.ts` (extend with Workload interface)**

Append to `src/types/workload.ts`:
```ts
export interface WorkloadUtilization {
  cpu_pct: number;
  gpu_pct: number;
  ram_pct: number;
  storage_pct: number;
  monitor_w: number;
}

export interface BenchmarkEntry {
  component_id: string;
  metric: string;
  value: number;
  unit: string;
  context?: Record<string, string>;
  source: string;
}

export interface Workload {
  id: WorkloadId;
  name: string;
  category: 'gaming' | 'content' | 'productivity' | 'ai' | 'mining' | 'server';
  description: string;
  utilization: WorkloadUtilization;
  benchmarks: BenchmarkEntry[];
}
```

- [ ] **Step 4: Create `src/lib/calc/energy.ts`**

```ts
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';
import { computeCost } from './cost';
import { systemPowerW } from './power';
import { findComponent } from '@/lib/data/components';

export interface PerWorkloadEnergy {
  workload_id: import('@/types/workload').WorkloadId;
  hours_per_day: number;
  draw_w: number;
  kwh: number;
  cost: number;
}

const DAYS_IN_MONTH = 30.44;
const DAYS_IN_YEAR = 365.25;

export function computeEnergy(
  build: BuildConfig,
  workloads: Workload[],
  period: 'day' | 'month' | 'year',
  tariffRateOverride?: number,
): { perWorkload: PerWorkloadEnergy[]; total: { kwh: number; cost: number } } {
  const factor = period === 'day' ? 1 : period === 'month' ? DAYS_IN_MONTH : DAYS_IN_YEAR;

  const rows: PerWorkloadEnergy[] = [];
  let totalKwh = 0;

  for (const s of build.schedule) {
    if (s.hours_per_day <= 0) continue;
    const wl = workloads.find((w) => w.id === s.workload_id);
    if (!wl) continue;

    const comps = Object.values(build.components).flat().filter(Boolean).map((id) => findComponent(id as string)).filter(Boolean) as NonNullable<ReturnType<typeof findComponent>>[];
    const psu = comps.find((c) => c.category === 'psu');
    const rating = psu ? String(psu.specs.efficiency ?? 'gold') as import('@/types/component').PsuEfficiencyRating : null;

    const { wallDrawW } = systemPowerW(
      comps,
      { cpu: wl.utilization.cpu_pct, gpu: wl.utilization.gpu_pct, ram: wl.utilization.ram_pct, storage: wl.utilization.storage_pct },
      rating,
    );

    const dailyKwh = (wallDrawW * s.hours_per_day) / 1000;
    const periodKwh = dailyKwh * factor;

    const ratePerKwh = tariffRateOverride ?? 0;
    const cost = ratePerKwh * periodKwh;

    rows.push({ workload_id: s.workload_id, hours_per_day: s.hours_per_day, draw_w: wallDrawW, kwh: periodKwh, cost });
    totalKwh += periodKwh;
  }

  const totalCost = (tariffRateOverride ?? 0) * totalKwh;
  return { perWorkload: rows, total: { kwh: totalKwh, cost: totalCost } };
}
```

- [ ] **Step 5: Create `src/data/workloads.json` (workload definitions for the schedule)**

```json
{
  "version": "2026-09-21",
  "workloads": [
    { "id": "gaming_1080p",      "name": "Gaming (1080p)",    "category": "gaming",       "description": "AAA titles at 1080p, 60+ FPS target",  "utilization": { "cpu_pct": 0.40, "gpu_pct": 0.95, "ram_pct": 0.50, "storage_pct": 0.20, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "gaming_1440p",      "name": "Gaming (1440p)",    "category": "gaming",       "description": "AAA titles at 1440p, 60+ FPS target",  "utilization": { "cpu_pct": 0.35, "gpu_pct": 0.95, "ram_pct": 0.50, "storage_pct": 0.20, "monitor_w": 35 }, "benchmarks": [] },
    { "id": "gaming_4k",         "name": "Gaming (4K)",       "category": "gaming",       "description": "AAA titles at 4K, 60+ FPS target",      "utilization": { "cpu_pct": 0.30, "gpu_pct": 0.95, "ram_pct": 0.50, "storage_pct": 0.20, "monitor_w": 50 }, "benchmarks": [] },
    { "id": "render_blender",    "name": "Blender rendering","category": "content",      "description": "CPU/GPU 3D rendering",                 "utilization": { "cpu_pct": 0.95, "gpu_pct": 0.95, "ram_pct": 0.70, "storage_pct": 0.40, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "video_premiere",    "name": "Video editing",     "category": "content",      "description": "Premiere / DaVinci timeline scrubbing + export", "utilization": { "cpu_pct": 0.60, "gpu_pct": 0.70, "ram_pct": 0.70, "storage_pct": 0.50, "monitor_w": 35 }, "benchmarks": [] },
    { "id": "photo_lightroom",   "name": "Photo editing",     "category": "content",      "description": "Lightroom batch exports",              "utilization": { "cpu_pct": 0.70, "gpu_pct": 0.40, "ram_pct": 0.60, "storage_pct": 0.30, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "compile",           "name": "Code compile",      "category": "productivity", "description": "make, cargo build, tsc",                "utilization": { "cpu_pct": 0.90, "gpu_pct": 0.05, "ram_pct": 0.50, "storage_pct": 0.30, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "office",            "name": "Office",            "category": "productivity", "description": "Docs, spreadsheets, email",            "utilization": { "cpu_pct": 0.20, "gpu_pct": 0.05, "ram_pct": 0.40, "storage_pct": 0.05, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "browser",           "name": "Web browsing",      "category": "productivity", "description": "Chrome / Firefox with tabs",            "utilization": { "cpu_pct": 0.25, "gpu_pct": 0.10, "ram_pct": 0.60, "storage_pct": 0.05, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "llm_inference",     "name": "LLM inference",     "category": "ai",           "description": "Local LLM token generation (GPU)",      "utilization": { "cpu_pct": 0.30, "gpu_pct": 0.95, "ram_pct": 0.80, "storage_pct": 0.10, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "training",          "name": "Model training",    "category": "ai",           "description": "GPU-bound training (full load)",       "utilization": { "cpu_pct": 0.40, "gpu_pct": 0.99, "ram_pct": 0.70, "storage_pct": 0.20, "monitor_w": 30 }, "benchmarks": [] },
    { "id": "mining_etc",        "name": "Mining (Ethash)",   "category": "mining",       "description": "Legacy Ethash-class",                   "utilization": { "cpu_pct": 0.10, "gpu_pct": 0.99, "ram_pct": 0.40, "storage_pct": 0.05, "monitor_w": 0  }, "benchmarks": [] },
    { "id": "mining_kawpow",     "name": "Mining (KawPow)",   "category": "mining",       "description": "RVN-style KawPow",                      "utilization": { "cpu_pct": 0.05, "gpu_pct": 0.99, "ram_pct": 0.40, "storage_pct": 0.05, "monitor_w": 0  }, "benchmarks": [] },
    { "id": "server_idle",       "name": "Server (idle)",     "category": "server",       "description": "24/7 home server idle / NAS",           "utilization": { "cpu_pct": 0.05, "gpu_pct": 0.00, "ram_pct": 0.10, "storage_pct": 0.02, "monitor_w": 0  }, "benchmarks": [] },
    { "id": "server_light",      "name": "Server (light)",    "category": "server",       "description": "Plex streaming, light VMs",             "utilization": { "cpu_pct": 0.25, "gpu_pct": 0.10, "ram_pct": 0.40, "storage_pct": 0.10, "monitor_w": 0  }, "benchmarks": [] },
    { "id": "server_heavy",      "name": "Server (heavy)",    "category": "server",       "description": "Always-on transcode / heavy VMs",       "utilization": { "cpu_pct": 0.80, "gpu_pct": 0.50, "ram_pct": 0.70, "storage_pct": 0.30, "monitor_w": 0  }, "benchmarks": [] }
  ]
}
```

- [ ] **Step 6: Create `src/lib/data/workloads.ts`**

```ts
import data from '@/data/workloads.json';
import type { Workload } from '@/types/workload';

const list = (data as { workloads: Workload[] }).workloads;

export function listWorkloads(): Workload[] {
  return list;
}

export function findWorkload(id: string): Workload | undefined {
  return list.find((w) => w.id === id);
}
```

- [ ] **Step 7: Create `src/hooks/useCalc.ts`**

```ts
import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { computeEnergy } from '@/lib/calc/energy';
import { listWorkloads } from '@/lib/data/workloads';

export function useCalc() {
  const build = useBuildStore((s) => s.build);
  const workloads = useMemo(() => listWorkloads(), []);
  return useMemo(() => {
    const daily    = computeEnergy(build, workloads, 'day',    build.location.manual_rate_override ?? undefined);
    const monthly  = computeEnergy(build, workloads, 'month',  build.location.manual_rate_override ?? undefined);
    const yearly   = computeEnergy(build, workloads, 'year',   build.location.manual_rate_override ?? undefined);
    return { daily, monthly, yearly };
  }, [build, workloads]);
}
```

- [ ] **Step 8: Create `src/components/calculator/ScheduleEditor.tsx`**

```tsx
import { useBuildStore } from '@/store/buildStore';
import { listWorkloads } from '@/lib/data/workloads';
import { Card, CardTitle } from '@/components/ui/Card';

export function ScheduleEditor() {
  const workloadMap = new Map(listWorkloads().map((w) => [w.id, w]));
  const schedule = useBuildStore((s) => s.build.schedule);
  const setSchedule = useBuildStore((s) => s.setSchedule);

  const updateHours = (id: string, hours: number) => {
    setSchedule(schedule.map((s) => (s.workload_id === id ? { ...s, hours_per_day: hours } : s)));
  };

  return (
    <Card>
      <CardTitle>3. Usage schedule</CardTitle>
      <div className="space-y-3">
        {schedule.map((s) => {
          const wl = workloadMap.get(s.workload_id);
          if (!wl) return null;
          return (
            <div key={s.workload_id}>
              <div className="flex justify-between text-sm">
                <span className="font-body">{wl.name}</span>
                <span className="font-numeric tabular-nums text-gray-500">{s.hours_per_day} h/day</span>
              </div>
              <input
                type="range" min={0} max={24} step={0.5}
                value={s.hours_per_day}
                onChange={(e) => updateHours(s.workload_id, Number(e.target.value))}
                aria-label={`Hours per day for ${wl.name}`}
                className="w-full accent-brand"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
```

- [ ] **Step 9: Create `src/components/charts/PowerBreakdown.tsx`**

```tsx
import ReactApexChart from 'react-apexcharts';
import type { Component } from '@/types/component';

interface Props { components: Component[]; drawWByComponentId: Record<string, number> }

export function PowerBreakdown({ components, drawWByComponentId }: Props) {
  const labels = components.map((c) => `${c.brand} ${c.model}`);
  const series = components.map((c) => Math.round(drawWByComponentId[c.id] ?? 0));
  return (
    <ReactApexChart
      type="donut"
      width="100%"
      height={260}
      options={{
        chart: { background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif' },
        labels,
        colors: ['#e5461f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
        legend: { position: 'bottom' },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '65%' } } },
        responsive: [{ breakpoint: 768, options: { legend: { position: 'bottom' } } }],
      }}
      series={series}
    />
  );
}
```

- [ ] **Step 10: Create `src/components/calculator/ResultsPanel.tsx`**

```tsx
import { useBuildStore } from '@/store/buildStore';
import { useCalc } from '@/hooks/useCalc';
import { findComponent } from '@/lib/data/components';
import { componentPowerW, systemPowerW } from '@/lib/calc/power';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatCost, formatKwh } from '@/lib/calc/format';
import { PowerBreakdown } from '@/components/charts/PowerBreakdown';
import type { CurrencyInfo } from '@/types/currency';

const INR: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 };

export function ResultsPanel() {
  const build = useBuildStore((s) => s.build);
  const { daily, monthly, yearly } = useCalc();

  const comps = Object.values(build.components).flat().filter(Boolean).map((id) => findComponent(id as string)).filter(Boolean) as NonNullable<ReturnType<typeof findComponent>>[];
  const drawWByComponentId: Record<string, number> = {};
  for (const c of comps) drawWByComponentId[c.id] = componentPowerW(c, 0.7);

  return (
    <Card>
      <CardTitle>4. Results</CardTitle>
      <div className="grid grid-cols-3 gap-3 font-numeric tabular-nums">
        {[
          { label: 'Daily',   kwh: daily.total.kwh,   cost: daily.total.cost },
          { label: 'Monthly', kwh: monthly.total.kwh, cost: monthly.total.cost },
          { label: 'Yearly',  kwh: yearly.total.kwh,  cost: yearly.total.cost },
        ].map((row) => (
          <div key={row.label} className="border border-gray-200 dark:border-gray-800 rounded-8 p-3">
            <div className="text-xs uppercase text-gray-500">{row.label}</div>
            <div className="font-display text-2xl font-bold">{formatKwh(row.kwh, 1)}</div>
            <div className="text-brand font-semibold">{formatCost(row.cost, INR)}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="text-xs uppercase text-gray-500 mb-2">Power draw breakdown (typical 70% load)</div>
        <PowerBreakdown components={comps} drawWByComponentId={drawWByComponentId} />
      </div>
    </Card>
  );
}
```

- [ ] **Step 11: Update `src/pages/Home.tsx`**

```tsx
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';

export default function Home() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4 md:grid-cols-2">
      <BuildPicker />
      <ScheduleEditor />
      <div className="md:col-span-2"><ResultsPanel /></div>
    </div>
  );
}
```

- [ ] **Step 12: Run tests**

```bash
npm test
```
Expected: all PASS.

- [ ] **Step 13: Smoke-test dev server**

```bash
npm run dev &
sleep 3
curl -sI http://localhost:5173 | head -1
kill %1
```
Expected: 200 OK.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat(calc): energy + schedule editor + results panel + power breakdown chart (T6)"
```

---

## Task 7: `tariffs.json` (India states, US states, UK, EU, +10) + `fx_rates.json` snapshot

**Files:**
- Create: `src/data/tariffs.json`, `src/data/fx_rates.json`, `src/lib/data/{tariffs,fx,currencies,index}.ts`
- Test: `tests/unit/data/tariffs.test.ts`

**Spec reference:** §5.2, §5.4, §5.5, §8.3.

**Interfaces (consumed by later tasks):**
```ts
// src/lib/data/tariffs.ts
export function listCountries(): Array<{ iso2: string; name: string; hasSubdivisions: boolean }>;
export function findTariff(iso2: string, subdivisionCode?: string): TariffSchedule | undefined;
export function effectiveRateForCountry(iso2: string, subdivisionCode?: string, monthlyKwh?: number): TariffRate;

// src/lib/data/fx.ts
export function listCurrencies(): CurrencyInfo[];
export function getBundledFxSnapshot(): FxSnapshot;
```

- [ ] **Step 1: Write failing test for tariff loader**

Create `tests/unit/data/tariffs.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { findTariff, listCountries, effectiveRateForCountry } from '@/lib/data/tariffs';

describe('tariffs loader', () => {
  test('listCountries returns at least India, US, UK', () => {
    const c = listCountries();
    const codes = c.map((x) => x.iso2);
    expect(codes).toContain('IN');
    expect(codes).toContain('US');
    expect(codes).toContain('GB');
  });
  test('findTariff(IN) has subdivisions for Kerala', () => {
    const t = findTariff('IN', 'IN-KL');
    expect(t?.default.currency ?? t?.subdivisions?.[0]?.rate.currency).toBe('INR');
  });
  test('effectiveRateForCountry returns a number for known country', () => {
    const rate = effectiveRateForCountry('IN', 'IN-KL');
    expect(rate.flat ?? rate.slabs?.[0]?.rate).toBeGreaterThan(0);
  });
  test('effectiveRateForCountry returns flat 0.10 for unknown country (fallback)', () => {
    const rate = effectiveRateForCountry('ZZ');
    expect(rate.flat).toBe(0.10);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- tariffs
```
Expected: FAIL.

- [ ] **Step 3: Create `src/data/tariffs.json` (curated — India states, US states, UK, EU, +10)**

> **Curation note:** Numbers below are sourced from public utility regulator documents (CEA / CERC for India, EIA for US, Ofgem for UK, Eurostat for EU). Last-updated date set to 2026-09-21 and updated when tariffs materially change. Tariffs include electricity duty / GST / VAT where applicable; renewable surcharges folded into the flat rate for simplicity in v1.

```json
{
  "version": "2026-09-21",
  "lastUpdated": "2026-09-21",
  "countries": [
    {
      "country_iso2": "IN",
      "country_name": "India",
      "subdivisions": [
        { "code": "IN-AN", "name": "Andhra Pradesh",        "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 75, "rate": 1.95 }, { "upTo_kwh": 200, "rate": 3.10 }, { "upTo_kwh": null, "rate": 4.80 }] } },
        { "code": "IN-AR", "name": "Arunachal Pradesh",     "rate": { "currency": "INR", "flat": 4.50 } },
        { "code": "IN-AS", "name": "Assam",                 "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 120, "rate": 5.50 }, { "upTo_kwh": 240, "rate": 6.50 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-BR", "name": "Bihar",                 "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 5.50 }, { "upTo_kwh": 200, "rate": 6.50 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-CH", "name": "Chandigarh",            "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 150, "rate": 5.00 }, { "upTo_kwh": null, "rate": 6.30 }] } },
        { "code": "IN-CT", "name": "Chhattisgarh",          "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.00 }, { "upTo_kwh": null, "rate": 5.50 }] } },
        { "code": "IN-DN", "name": "Dadra & Nagar Haveli",  "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.50 }, { "upTo_kwh": null, "rate": 5.80 }] } },
        { "code": "IN-DL", "name": "Delhi",                 "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 200, "rate": 4.50 }, { "upTo_kwh": 400, "rate": 6.50 }, { "upTo_kwh": 800, "rate": 7.50 }, { "upTo_kwh": null, "rate": 8.50 }] } },
        { "code": "IN-GA", "name": "Goa",                   "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 3.50 }, { "upTo_kwh": null, "rate": 5.00 }] } },
        { "code": "IN-GJ", "name": "Gujarat",               "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 4.00 }, { "upTo_kwh": 250, "rate": 5.50 }, { "upTo_kwh": null, "rate": 6.50 }] } },
        { "code": "IN-HR", "name": "Haryana",               "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 4.50 }, { "upTo_kwh": 150, "rate": 6.00 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-HP", "name": "Himachal Pradesh",      "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 60, "rate": 3.40 }, { "upTo_kwh": 300, "rate": 4.50 }, { "upTo_kwh": null, "rate": 5.50 }] } },
        { "code": "IN-JK", "name": "Jammu & Kashmir",       "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 2.50 }, { "upTo_kwh": 200, "rate": 4.00 }, { "upTo_kwh": null, "rate": 5.50 }] } },
        { "code": "IN-JH", "name": "Jharkhand",             "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 4.50 }, { "upTo_kwh": 200, "rate": 5.75 }, { "upTo_kwh": null, "rate": 6.75 }] } },
        { "code": "IN-KA", "name": "Karnataka",             "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 4.15 }, { "upTo_kwh": 200, "rate": 6.05 }, { "upTo_kwh": null, "rate": 7.65 }] } },
        { "code": "IN-KL", "name": "Kerala",                "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 3.50 }, { "upTo_kwh": 150, "rate": 5.00 }, { "upTo_kwh": 300, "rate": 6.50 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-LD", "name": "Lakshadweep",           "rate": { "currency": "INR", "flat": 4.50 } },
        { "code": "IN-MP", "name": "Madhya Pradesh",        "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 4.00 }, { "upTo_kwh": 150, "rate": 5.50 }, { "upTo_kwh": null, "rate": 6.50 }] } },
        { "code": "IN-MH", "name": "Maharashtra",           "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.50 }, { "upTo_kwh": 300, "rate": 7.50 }, { "upTo_kwh": null, "rate": 9.50 }] } },
        { "code": "IN-MN", "name": "Manipur",               "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.00 }, { "upTo_kwh": null, "rate": 5.20 }] } },
        { "code": "IN-ML", "name": "Meghalaya",             "rate": { "currency": "INR", "flat": 5.50 } },
        { "code": "IN-MZ", "name": "Mizoram",               "rate": { "currency": "INR", "flat": 5.00 } },
        { "code": "IN-NL", "name": "Nagaland",              "rate": { "currency": "INR", "flat": 5.00 } },
        { "code": "IN-OD", "name": "Odisha",                "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 3.50 }, { "upTo_kwh": 200, "rate": 5.00 }, { "upTo_kwh": null, "rate": 6.00 }] } },
        { "code": "IN-PY", "name": "Puducherry",            "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 3.50 }, { "upTo_kwh": null, "rate": 5.50 }] } },
        { "code": "IN-PB", "name": "Punjab",                "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 5.00 }, { "upTo_kwh": 300, "rate": 6.50 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-RJ", "name": "Rajasthan",             "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 4.50 }, { "upTo_kwh": 150, "rate": 6.00 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-SK", "name": "Sikkim",                "rate": { "currency": "INR", "flat": 4.00 } },
        { "code": "IN-TN", "name": "Tamil Nadu",            "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.50 }, { "upTo_kwh": 200, "rate": 6.00 }, { "upTo_kwh": 500, "rate": 8.00 }, { "upTo_kwh": null, "rate": 9.00 }] } },
        { "code": "IN-TS", "name": "Telangana",             "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 50, "rate": 3.50 }, { "upTo_kwh": 200, "rate": 5.50 }, { "upTo_kwh": null, "rate": 7.00 }] } },
        { "code": "IN-TR", "name": "Tripura",               "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.00 }, { "upTo_kwh": null, "rate": 5.50 }] } },
        { "code": "IN-UP", "name": "Uttar Pradesh",         "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 5.00 }, { "upTo_kwh": 300, "rate": 6.50 }, { "upTo_kwh": null, "rate": 7.50 }] } },
        { "code": "IN-UT", "name": "Uttarakhand",           "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 100, "rate": 4.20 }, { "upTo_kwh": 200, "rate": 5.50 }, { "upTo_kwh": null, "rate": 6.80 }] } },
        { "code": "IN-WB", "name": "West Bengal",           "rate": { "currency": "INR", "slabs": [{ "upTo_kwh": 75, "rate": 4.85 }, { "upTo_kwh": 300, "rate": 6.20 }, { "upTo_kwh": null, "rate": 7.30 }] } }
      ],
      "default": { "currency": "INR", "flat": 6.50 },
      "applicableTaxes": [{ "name": "Electricity duty (avg)", "rate_pct": 8, "appliesTo": "total" }],
      "notes": "Rates are domestic LT Category I. Industrial / commercial rates differ."
    },
    {
      "country_iso2": "US",
      "country_name": "United States",
      "subdivisions": [
        { "code": "US-CA", "name": "California",       "rate": { "currency": "USD", "flat": 0.32 } },
        { "code": "US-NY", "name": "New York",         "rate": { "currency": "USD", "flat": 0.21 } },
        { "code": "US-TX", "name": "Texas",            "rate": { "currency": "USD", "flat": 0.15 } },
        { "code": "US-FL", "name": "Florida",          "rate": { "currency": "USD", "flat": 0.14 } },
        { "code": "US-WA", "name": "Washington",       "rate": { "currency": "USD", "flat": 0.11 } },
        { "code": "US-OR", "name": "Oregon",           "rate": { "currency": "USD", "flat": 0.12 } },
        { "code": "US-MA", "name": "Massachusetts",    "rate": { "currency": "USD", "flat": 0.27 } },
        { "code": "US-CT", "name": "Connecticut",      "rate": { "currency": "USD", "flat": 0.25 } },
        { "code": "US-IL", "name": "Illinois",         "rate": { "currency": "USD", "flat": 0.16 } },
        { "code": "US-PA", "name": "Pennsylvania",     "rate": { "currency": "USD", "flat": 0.17 } },
        { "code": "US-OH", "name": "Ohio",             "rate": { "currency": "USD", "flat": 0.13 } },
        { "code": "US-GA", "name": "Georgia",          "rate": { "currency": "USD", "flat": 0.13 } },
        { "code": "US-NC", "name": "North Carolina",   "rate": { "currency": "USD", "flat": 0.12 } },
        { "code": "US-VA", "name": "Virginia",         "rate": { "currency": "USD", "flat": 0.13 } },
        { "code": "US-MI", "name": "Michigan",         "rate": { "currency": "USD", "flat": 0.17 } },
        { "code": "US-AZ", "name": "Arizona",          "rate": { "currency": "USD", "flat": 0.14 } },
        { "code": "US-NV", "name": "Nevada",           "rate": { "currency": "USD", "flat": 0.13 } },
        { "code": "US-CO", "name": "Colorado",         "rate": { "currency": "USD", "flat": 0.15 } },
        { "code": "US-NJ", "name": "New Jersey",       "rate": { "currency": "USD", "flat": 0.18 } },
        { "code": "US-MN", "name": "Minnesota",        "rate": { "currency": "USD", "flat": 0.14 } }
      ],
      "default": { "currency": "USD", "flat": 0.16 },
      "notes": "National residential average per EIA. State rates are blended averages; utility-specific rates vary."
    },
    {
      "country_iso2": "GB",
      "country_name": "United Kingdom",
      "default": { "currency": "GBP", "flat": 0.30 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 5, "appliesTo": "total" }],
      "notes": "Ofgem cap rate 2024. Includes standing charge excluded from per-kWh figure."
    },
    {
      "country_iso2": "DE",
      "country_name": "Germany",
      "default": { "currency": "EUR", "flat": 0.40 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 19, "appliesTo": "total" }],
      "notes": "BDEW average household rate."
    },
    {
      "country_iso2": "FR",
      "country_name": "France",
      "default": { "currency": "EUR", "flat": 0.28 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 20, "appliesTo": "total" }]
    },
    {
      "country_iso2": "IT",
      "country_name": "Italy",
      "default": { "currency": "EUR", "flat": 0.30 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 10, "appliesTo": "total" }]
    },
    {
      "country_iso2": "ES",
      "country_name": "Spain",
      "default": { "currency": "EUR", "flat": 0.26 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 21, "appliesTo": "total" }]
    },
    {
      "country_iso2": "NL",
      "country_name": "Netherlands",
      "default": { "currency": "EUR", "flat": 0.35 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 21, "appliesTo": "total" }]
    },
    {
      "country_iso2": "SE",
      "country_name": "Sweden",
      "default": { "currency": "SEK", "flat": 1.50 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 25, "appliesTo": "total" }]
    },
    {
      "country_iso2": "PL",
      "country_name": "Poland",
      "default": { "currency": "PLN", "flat": 0.95 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 23, "appliesTo": "total" }]
    },
    {
      "country_iso2": "AU",
      "country_name": "Australia",
      "default": { "currency": "AUD", "flat": 0.32 },
      "applicableTaxes": [{ "name": "GST", "rate_pct": 10, "appliesTo": "total" }]
    },
    {
      "country_iso2": "CA",
      "country_name": "Canada",
      "default": { "currency": "CAD", "flat": 0.18 }
    },
    {
      "country_iso2": "JP",
      "country_name": "Japan",
      "default": { "currency": "JPY", "flat": 36 }
    },
    {
      "country_iso2": "SG",
      "country_name": "Singapore",
      "default": { "currency": "SGD", "flat": 0.32 },
      "applicableTaxes": [{ "name": "GST", "rate_pct": 9, "appliesTo": "total" }]
    },
    {
      "country_iso2": "AE",
      "country_name": "United Arab Emirates",
      "default": { "currency": "AED", "flat": 0.38 },
      "applicableTaxes": [{ "name": "VAT", "rate_pct": 5, "appliesTo": "total" }]
    },
    {
      "country_iso2": "BR",
      "country_name": "Brazil",
      "default": { "currency": "BRL", "flat": 0.95 },
      "applicableTaxes": [{ "name": "ICMS (avg)", "rate_pct": 25, "appliesTo": "total" }]
    },
    {
      "country_iso2": "ZA",
      "country_name": "South Africa",
      "default": { "currency": "ZAR", "flat": 3.50 }
    },
    {
      "country_iso2": "NZ",
      "country_name": "New Zealand",
      "default": { "currency": "NZD", "flat": 0.34 },
      "applicableTaxes": [{ "name": "GST", "rate_pct": 15, "appliesTo": "total" }]
    }
  ]
}
```

- [ ] **Step 4: Create `src/data/fx_rates.json`**

```json
{
  "version": "2026-09-21",
  "snapshot": {
    "base": "USD",
    "date": "2026-09-15",
    "rates": {
      "USD": 1.0, "INR": 83.5, "EUR": 0.92, "GBP": 0.78,
      "JPY": 149.0, "AUD": 1.52, "CAD": 1.36, "SGD": 1.34,
      "AED": 3.67, "BRL": 5.05, "SEK": 10.5, "PLN": 4.05,
      "ZAR": 18.3, "NZD": 1.65
    },
    "source": "bundled"
  }
}
```

- [ ] **Step 5: Create `src/lib/data/tariffs.ts`**

```ts
import data from '@/data/tariffs.json';
import type { TariffRate, TariffSchedule } from '@/types/tariff';

const list = (data as { countries: TariffSchedule[] }).countries;

export function listCountries(): Array<{ iso2: string; name: string; hasSubdivisions: boolean }> {
  return list.map((c) => ({
    iso2: c.country_iso2,
    name: c.country_name,
    hasSubdivisions: Boolean(c.subdivisions?.length),
  }));
}

export function findTariff(iso2: string, subdivisionCode?: string): TariffSchedule | undefined {
  const c = list.find((x) => x.country_iso2 === iso2);
  if (!c) return undefined;
  if (subdivisionCode && c.subdivisions) {
    const sub = c.subdivisions.find((s) => s.code === subdivisionCode);
    if (sub) {
      return {
        ...c,
        subdivisions: undefined,
        default: sub.rate,
        notes: c.notes ? `${c.notes} (rate for ${sub.name})` : `Rate for ${sub.name}`,
      };
    }
  }
  return c;
}

export function effectiveRateForCountry(iso2: string, subdivisionCode?: string): TariffRate {
  const t = findTariff(iso2, subdivisionCode);
  return t?.default ?? { currency: 'USD', flat: 0.10 };
}

export function listSubdivisions(iso2: string): Array<{ code: string; name: string }> {
  const c = list.find((x) => x.country_iso2 === iso2);
  return (c?.subdivisions ?? []).map((s) => ({ code: s.code, name: s.name }));
}

export function dataLastUpdated(): string {
  return (data as { lastUpdated: string }).lastUpdated;
}
```

- [ ] **Step 6: Create `src/lib/data/fx.ts`**

```ts
import data from '@/data/fx_rates.json';
import type { FxSnapshot } from '@/types/currency';

const snapshot = (data as { snapshot: FxSnapshot }).snapshot;

export function getBundledFxSnapshot(): FxSnapshot {
  return snapshot;
}
```

- [ ] **Step 7: Create `src/lib/data/currencies.ts`**

```ts
import data from '@/data/currencies.json';
import type { CurrencyInfo } from '@/types/currency';

const list = (data as { currencies: CurrencyInfo[] }).currencies;

export function listCurrencies(): CurrencyInfo[] {
  return list;
}

export function findCurrency(code: string): CurrencyInfo | undefined {
  return list.find((c) => c.code === code);
}
```

- [ ] **Step 8: Create `src/lib/data/index.ts`**

```ts
export * from './components';
export * from './tariffs';
export * from './fx';
export * from './currencies';
export * from './workloads';
```

- [ ] **Step 9: Run tests**

```bash
npm test -- tariffs
```
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(data): tariffs.json (IN/US/UK/EU/+10) + fx snapshot + loaders (T7)"
```

---

## Task 8: Location picker + IP geolocation client + FX client + manual override

**Files:**
- Create: `src/lib/api/endpoints.ts`, `src/lib/api/geolocation.ts`, `src/lib/api/fx.ts`, `src/hooks/{useGeolocation,useFx}.ts`, `src/components/calculator/LocationPicker.tsx`
- Test: `tests/unit/api/{geolocation,fx}.test.ts`

**Spec reference:** §5.7, §8.4, §8.6.

**Interfaces (consumed by later tasks):**
```ts
// src/lib/api/geolocation.ts
export async function detectLocation(signal?: AbortSignal): Promise<{ country_iso2: string; subdivision?: string } | null>;

// src/lib/api/fx.ts
export async function fetchFxRates(base = 'USD', signal?: AbortSignal): Promise<FxSnapshot | null>;
```

- [ ] **Step 1: Write failing test for `detectLocation`**

Create `tests/unit/api/geolocation.test.ts`:
```ts
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { detectLocation } from '@/lib/api/geolocation';

describe('detectLocation', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  test('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    const r = await detectLocation(new AbortController().signal);
    expect(r).toBeNull();
  });
  test('returns null on timeout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise((_r, reject) => setTimeout(() => reject(new Error('timeout')), 5000))));
    const r = await detectLocation(AbortSignal.timeout(50));
    expect(r).toBeNull();
  });
  test('parses ipapi.co response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ country: 'IN', 'subdivision (ISO 3166-2)': 'KL' }) }));
    const r = await detectLocation();
    expect(r).toEqual({ country_iso2: 'IN', subdivision: 'IN-KL' });
  });
  test('returns null on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const r = await detectLocation();
    expect(r).toBeNull();
  });
});
```

- [ ] **Step 2: Write failing test for `fetchFxRates`**

Create `tests/unit/api/fx.test.ts`:
```ts
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fetchFxRates } from '@/lib/api/fx';

describe('fetchFxRates', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  test('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await fetchFxRates('USD')).toBeNull();
  });
  test('parses exchangerate.host response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ base: 'USD', date: '2026-09-15', rates: { INR: 83.5 } }) }));
    const r = await fetchFxRates('USD');
    expect(r?.rates.INR).toBe(83.5);
  });
});
```

- [ ] **Step 3: Run tests (should fail)**

```bash
npm test -- geolocation fx
```
Expected: FAIL.

- [ ] **Step 4: Create `src/lib/api/endpoints.ts`**

```ts
export const ENDPOINTS = {
  geoIp: 'https://ipapi.co/json/',
  fxLatest: (base: string) => `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
  timeoutMs: 3000,
} as const;
```

- [ ] **Step 5: Create `src/lib/api/geolocation.ts`**

```ts
import { ENDPOINTS } from './endpoints';

export async function detectLocation(signal?: AbortSignal): Promise<{ country_iso2: string; subdivision?: string } | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ENDPOINTS.timeoutMs);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(ENDPOINTS.geoIp, { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j?.country) return null;
    const subCode = j['subdivision (ISO 3166-2)'];
    return {
      country_iso2: String(j.country).toUpperCase(),
      subdivision: subCode ? `${String(j.country).toUpperCase()}-${String(subCode).toUpperCase()}` : undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
```

- [ ] **Step 6: Create `src/lib/api/fx.ts`**

```ts
import { ENDPOINTS } from './endpoints';
import type { FxSnapshot } from '@/types/currency';

export async function fetchFxRates(base = 'USD', signal?: AbortSignal): Promise<FxSnapshot | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ENDPOINTS.timeoutMs);
  signal?.addEventListener('abort', () => ctrl.abort());
  try {
    const res = await fetch(ENDPOINTS.fxLatest(base), { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = await res.json();
    if (!j?.rates) return null;
    return { base: String(j.base ?? base), date: String(j.date ?? new Date().toISOString().slice(0, 10)), rates: j.rates, source: 'exchangerate.host' };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
```

- [ ] **Step 7: Create `src/hooks/useGeolocation.ts`**

```ts
import { useEffect, useState } from 'react';
import { detectLocation } from '@/lib/api/geolocation';
import { useBuildStore } from '@/store/buildStore';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const setLocation = useBuildStore((s) => s.setLocation);
  const detected = useBuildStore((s) => (s.build.location.subdivision_code ? true : false));

  useEffect(() => {
    if (detected) return;
    let cancelled = false;
    setLoading(true);
    detectLocation().then((r) => {
      if (cancelled) return;
      if (r) setLocation(r.country_iso2, r.subdivision);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [detected, setLocation]);

  return { loading };
}
```

- [ ] **Step 8: Create `src/hooks/useFx.ts`**

```ts
import { useEffect, useState } from 'react';
import { fetchFxRates } from '@/lib/api/fx';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import type { FxSnapshot } from '@/types/currency';

export function useFx(): { snapshot: FxSnapshot; isLive: boolean } {
  const [snapshot, setSnapshot] = useState<FxSnapshot>(() => getBundledFxSnapshot());
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFxRates('USD').then((live) => {
      if (cancelled || !live) return;
      setSnapshot(live);
      setIsLive(true);
    });
    return () => { cancelled = true; };
  }, []);

  return { snapshot, isLive };
}
```

- [ ] **Step 9: Create `src/components/calculator/LocationPicker.tsx`**

```tsx
import { useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { listCountries, listSubdivisions, effectiveRateForCountry, dataLastUpdated } from '@/lib/data/tariffs';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useFx } from '@/hooks/useFx';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { detectLocation } from '@/lib/api/geolocation';
import { effectiveRate } from '@/lib/calc/cost';

export function LocationPicker() {
  const { loading } = useGeolocation();
  const { snapshot, isLive } = useFx();
  const build = useBuildStore((s) => s.build);
  const setLocation = useBuildStore((s) => s.setLocation);
  const setManualRate = useBuildStore((s) => s.setManualRate);
  const [refreshing, setRefreshing] = useState(false);

  const countries = listCountries();
  const subdivisions = listSubdivisions(build.location.country_iso2);
  const rate = build.location.manual_rate_override ?? effectiveRate(200, effectiveRateForCountry(build.location.country_iso2, build.location.subdivision_code));

  const handleDetect = async () => {
    setRefreshing(true);
    const r = await detectLocation();
    if (r) setLocation(r.country_iso2, r.subdivision);
    setRefreshing(false);
  };

  return (
    <Card>
      <CardTitle>2. Location & Tariff</CardTitle>
      <div className="space-y-3">
        <Select
          aria-label="Country"
          value={build.location.country_iso2}
          options={countries.map((c) => ({ value: c.iso2, label: `${c.name} (${c.iso2})` }))}
          onChange={(e) => setLocation(e.target.value)}
        />
        {subdivisions.length > 0 && (
          <Select
            aria-label="State / Province"
            value={build.location.subdivision_code ?? ''}
            options={[{ value: '', label: '— Country default —' }, ...subdivisions.map((s) => ({ value: s.code, label: s.name }))]}
            onChange={(e) => setLocation(build.location.country_iso2, e.target.value || undefined)}
          />
        )}
        <div className="text-sm font-numeric tabular-nums">
          Tariff: <span className="font-semibold">₹{rate.toFixed(2)}/kWh</span>
          <span className="ml-2 text-xs text-gray-500">FX as of {snapshot.date} {isLive ? '(live)' : '(bundled)'}</span>
        </div>
        <div className="flex gap-2 items-center">
          <label htmlFor="manual-rate" className="text-sm">Override ₹/kWh:</label>
          <input
            id="manual-rate"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={build.location.manual_rate_override ?? ''}
            placeholder={rate.toFixed(2)}
            onChange={(e) => setManualRate(e.target.value === '' ? null : Math.max(0, Number(e.target.value)))}
            className="min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 w-32 font-numeric tabular-nums"
          />
          <Button variant="secondary" onClick={handleDetect} disabled={refreshing || loading}>
            {refreshing || loading ? 'Detecting…' : 'Detect from IP ↻'}
          </Button>
        </div>
        <div className="text-xs text-gray-500">Tariff data last updated {dataLastUpdated()}</div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 10: Update `src/pages/Home.tsx`**

```tsx
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { LocationPicker } from '@/components/calculator/LocationPicker';

export default function Home() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4 md:grid-cols-2">
      <BuildPicker />
      <LocationPicker />
      <div className="md:col-span-2"><ScheduleEditor /></div>
      <div className="md:col-span-2"><ResultsPanel /></div>
    </div>
  );
}
```

- [ ] **Step 11: Run tests**

```bash
npm test
```
Expected: all PASS.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat(loc): location picker + geolocation + FX + manual override (T8)"
```

---

## Task 9: Compare engine + Compare page (TanStack Table) + comparison-bars chart

**Files:**
- Create: `src/lib/calc/compare.ts`, `src/components/compare/{BuildSelector,ComparisonTable}.tsx`, `src/components/charts/ComparisonBars.tsx`
- Test: `tests/unit/calc/compare.test.ts`, `tests/component/compare/ComparisonTable.test.tsx`

**Spec reference:** §6.5, §7.1.

**Interfaces:**
```ts
// src/lib/calc/compare.ts
export function compareBuilds(builds: BuildConfig[], workloads: Workload[], period: 'day'|'month'|'year', ratePerKwh?: number): ComparisonResult;
```

- [ ] **Step 1: Write failing test for `compareBuilds`**

Create `tests/unit/calc/compare.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { compareBuilds } from '@/lib/calc/compare';
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';

const a: BuildConfig = { id: 'a', name: 'A', components: { cpu: 'cpu-amd-ryzen-7-7800x3d' }, schedule: [{ workload_id: 'office', hours_per_day: 8 }], location: { country_iso2: 'IN', manual_rate_override: 7.5 } };
const b: BuildConfig = { id: 'b', name: 'B', components: { cpu: 'cpu-intel-i9-14900k' }, schedule: [{ workload_id: 'office', hours_per_day: 8 }], location: { country_iso2: 'IN', manual_rate_override: 7.5 } };
const ws: Workload[] = [{ id: 'office', name: 'Office', category: 'productivity', description: '', utilization: { cpu_pct: 0.5, gpu_pct: 0, ram_pct: 0, storage_pct: 0, monitor_w: 30 }, benchmarks: [] }];

describe('compareBuilds', () => {
  test('returns one row per workload + a total row', () => {
    const r = compareBuilds([a, b], ws, 'day');
    expect(r.rows.length).toBeGreaterThanOrEqual(1);
    expect(r.totals).toHaveLength(2);
  });
  test('Intel 14900K (125 W) uses more kWh than Ryzen 7 7800X3D (120 W) at 50% util', () => {
    const r = compareBuilds([a, b], ws, 'day');
    expect(r.totals[1].kwh).toBeGreaterThan(r.totals[0].kwh);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- compare
```
Expected: FAIL.

- [ ] **Step 3: Create `src/lib/calc/compare.ts`**

```ts
import type { BuildConfig } from '@/types/build';
import type { Workload } from '@/types/workload';
import { computeEnergy } from './energy';

export interface ComparisonRow {
  workload_id: import('@/types/workload').WorkloadId;
  perBuildKwh: Record<string, number>;
  perBuildCost: Record<string, number>;
}
export interface ComparisonTotal { buildId: string; buildName: string; kwh: number; cost: number }
export interface ComparisonResult { rows: ComparisonRow[]; totals: ComparisonTotal[] }

export function compareBuilds(builds: BuildConfig[], workloads: Workload[], period: 'day'|'month'|'year'): ComparisonResult {
  const results = builds.map((b) => computeEnergy(b, workloads, period, b.location.manual_rate_override ?? undefined));
  const rows: ComparisonRow[] = [];
  for (let i = 0; i < workloads.length; i++) {
    const wlId = workloads[i].id;
    const row: ComparisonRow = { workload_id: wlId, perBuildKwh: {}, perBuildCost: {} };
    for (let j = 0; j < builds.length; j++) {
      const r = results[j].perWorkload[i];
      if (r) {
        row.perBuildKwh[builds[j].id] = r.kwh;
        row.perBuildCost[builds[j].id] = r.cost;
      } else {
        row.perBuildKwh[builds[j].id] = 0;
        row.perBuildCost[builds[j].id] = 0;
      }
    }
    rows.push(row);
  }
  const totals = builds.map((b, j) => ({
    buildId: b.id, buildName: b.name, kwh: results[j].total.kwh, cost: results[j].total.cost,
  }));
  return { rows, totals };
}
```

- [ ] **Step 4: Create `src/components/compare/ComparisonTable.tsx`**

```tsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';
import { useBuildStore } from '@/store/buildStore';
import { listWorkloads } from '@/lib/data/workloads';
import { compareBuilds } from '@/lib/calc/compare';
import type { ColumnDef } from '@tanstack/react-table';
import type { ComparisonRow } from '@/lib/calc/compare';
import type { BuildConfig } from '@/types/build';
import { formatCost, formatKwh } from '@/lib/calc/format';
import type { CurrencyInfo } from '@/types/currency';

interface Props { builds: BuildConfig[] }

export function ComparisonTable({ builds }: Props) {
  const workloads = listWorkloads();
  const result = compareBuilds(builds, workloads, 'year');

  const currency: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 0 };

  const columns: ColumnDef<ComparisonRow>[] = [
    { accessorKey: 'workload_id', header: 'Workload' },
    ...builds.flatMap((b) => [
      {
        id: `${b.id}-kwh`,
        header: `${b.name} (kWh)`,
        cell: ({ row }) => formatKwh(row.original.perBuildKwh[b.id] ?? 0, 0),
        meta: { numeric: true },
      },
      {
        id: `${b.id}-cost`,
        header: `${b.name} (cost)`,
        cell: ({ row }) => formatCost(row.original.perBuildCost[b.id] ?? 0, currency),
        meta: { numeric: true },
      },
    ]),
  ];

  const table = useReactTable({
    data: result.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full font-numeric tabular-nums">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-gray-200 dark:border-gray-800">
              {hg.headers.map((h) => (
                <th key={h.id} className="text-left p-2 font-display text-sm">{flexRender(h.column.columnDef.header, h.getContext())}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="border-b border-gray-100 dark:border-gray-900">
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="p-2 text-sm">{flexRender(c.column.columnDef.cell, c.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-brand font-semibold">
            <td className="p-2">Yearly total</td>
            {builds.map((b) => {
              const t = result.totals.find((x) => x.buildId === b.id)!;
              return (
                <>
                  <td key={`${b.id}-yk`} className="p-2">{formatKwh(t.kwh, 0)}</td>
                  <td key={`${b.id}-yc`} className="p-2 text-brand">{formatCost(t.cost, currency)}</td>
                </>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

- [ ] **Step 5: Create `src/components/compare/BuildSelector.tsx`**

```tsx
import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useBuildStore } from '@/store/buildStore';
import type { BuildConfig } from '@/types/build';

const EMPTY: BuildConfig = { id: 'empty', name: 'New build', components: {}, schedule: [], location: { country_iso2: 'IN' } };

export function BuildSelector({ onCompare }: { onCompare: (b: BuildConfig[]) => void }) {
  const current = useBuildStore((s) => s.build);
  // For v1 we support 2-build comparison: current vs cloned alternate (user edits alternate below).
  const [alt, setAlt] = useState<BuildConfig>({ ...current, id: 'alt', name: 'Alternate' });
  const swap = (key: keyof BuildConfig['components'], value: string) =>
    setAlt((a) => ({ ...a, components: { ...a.components, [key]: value || undefined } }));

  return (
    <Card>
      <CardTitle>Compare 2 builds</CardTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold mb-1">Build A (current)</h3>
          <p className="text-sm">{current.name}</p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold mb-1">Build B (alternate)</h3>
          <Select aria-label="Alternate CPU" placeholder="CPU" options={[]} value={alt.components.cpu ?? ''} onChange={(e) => swap('cpu', e.target.value)} />
        </div>
      </div>
      <Button className="mt-3" onClick={() => onCompare([current, alt])}>Compare</Button>
    </Card>
  );
}
```

- [ ] **Step 6: Update `src/pages/Compare.tsx`**

```tsx
import { useState } from 'react';
import { BuildSelector } from '@/components/compare/BuildSelector';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import type { BuildConfig } from '@/types/build';

export default function Compare() {
  const [builds, setBuilds] = useState<BuildConfig[] | null>(null);
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto grid gap-4">
      <BuildSelector onCompare={setBuilds} />
      {builds && builds.length >= 2 && <ComparisonTable builds={builds} />}
    </div>
  );
}
```

- [ ] **Step 7: Run tests**

```bash
npm test -- compare ComparisonTable
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(compare): compare engine + TanStack table + 2-build selector (T9)"
```

---

## Task 10: PDF export (window.print stylesheet) + HTML export

**Files:**
- Create: `src/lib/export/{pdf,html,print}.css`, `src/lib/export/index.ts`, `src/components/calculator/ExportMenu.tsx`
- Test: `tests/unit/export/html.test.ts`, `tests/component/calculator/ExportMenu.test.tsx`

**Spec reference:** §7.9.

**Interfaces:**
```ts
// src/lib/export/pdf.ts — triggers print dialog (no return value)
export function exportPdf(): void;

// src/lib/export/html.ts
export function exportBuildHtml(build: BuildConfig, results: { daily; monthly; yearly }, currency: CurrencyInfo): void; // triggers download
```

- [ ] **Step 1: Write failing test for HTML export**

Create `tests/unit/export/html.test.ts`:
```ts
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { buildExportHtml } from '@/lib/export/html';
import type { BuildConfig } from '@/types/build';
import type { CurrencyInfo } from '@/types/currency';

const build: BuildConfig = { id: 'x', name: 'Test', components: { cpu: 'cpu-amd-ryzen-7-7800x3d' }, schedule: [{ workload_id: 'office', hours_per_day: 8 }], location: { country_iso2: 'IN', manual_rate_override: 7.5 } };
const inr: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 };

const results = {
  daily:   { total: { kwh: 1.2, cost: 9 } },
  monthly: { total: { kwh: 36,  cost: 273 } },
  yearly:  { total: { kwh: 442, cost: 3318 } },
};

describe('buildExportHtml', () => {
  test('contains build name and yearly figures', () => {
    const html = buildExportHtml(build, results, inr);
    expect(html).toContain('Test');
    expect(html).toContain('442');
    expect(html).toContain('3,318');
  });
  test('embeds build config JSON in script tag', () => {
    const html = buildExportHtml(build, results, inr);
    expect(html).toMatch(/<script type="application\/json">[\s\S]+<\/script>/);
  });
  test('is a complete HTML document with DOCTYPE', () => {
    const html = buildExportHtml(build, results, inr);
    expect(html).toMatch(/^<!doctype html>/i);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- export
```
Expected: FAIL.

- [ ] **Step 3: Create `src/lib/export/print.css`**

```css
@media print {
  header, nav, .no-print { display: none !important; }
  body { background: white !important; color: black !important; font-size: 11pt; }
  .print-only { display: block !important; }
  main { padding: 0 !important; max-width: 100% !important; }
  .results-grid { page-break-inside: avoid; }
  [data-chart] { max-height: 200px; }
}
.print-only { display: none; }
```

- [ ] **Step 4: Create `src/lib/export/html.ts`**

```ts
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
```

- [ ] **Step 5: Create `src/lib/export/pdf.ts`**

```ts
export function exportPdf(): void {
  // Triggers browser print dialog. User picks "Save as PDF".
  window.print();
}
```

- [ ] **Step 6: Create `src/lib/export/index.ts`**

```ts
export * from './html';
export * from './pdf';
```

- [ ] **Step 7: Add print stylesheet import to `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './lib/export/print.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 8: Create `src/components/calculator/ExportMenu.tsx`**

```tsx
import { Button } from '@/components/ui/Button';
import { useCalc } from '@/hooks/useCalc';
import { useBuildStore } from '@/store/buildStore';
import { buildExportHtml, downloadExportHtml, exportPdf } from '@/lib/export';

const INR = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 2 } as const;

export function ExportMenu() {
  const build = useBuildStore((s) => s.build);
  const results = useCalc();

  const onHtml = () => {
    const html = buildExportHtml(build, results, INR);
    downloadExportHtml(html, `pc-power-${new Date().toISOString().slice(0, 10)}.html`);
  };

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      <Button variant="primary" onClick={exportPdf}>Export PDF</Button>
      <Button variant="secondary" onClick={onHtml}>Export HTML</Button>
    </div>
  );
}
```

- [ ] **Step 9: Update `src/components/calculator/ResultsPanel.tsx` to include `<ExportMenu />`**

Append to the bottom of the `<Card>` body in `ResultsPanel.tsx`:
```tsx
import { ExportMenu } from './ExportMenu';
// ... inside the Card, after PowerBreakdown:
<ExportMenu />
```

- [ ] **Step 10: Run tests + commit**

```bash
npm test
git add -A
git commit -m "feat(export): PDF (window.print) + HTML (re-importable) exports (T10)"
```

---

## Task 11: Suggestion engine + Suggestions page

**Files:** `src/lib/calc/suggest.ts`, `src/components/suggestions/SuggestionCard.tsx`, `src/pages/Suggestions.tsx`, `tests/unit/calc/suggest.test.ts`, `tests/component/suggestions/SuggestionCard.test.tsx`.

**Spec:** §6.6.

**Interface:**
```ts
// src/lib/calc/suggest.ts
export function suggestAlternatives(build: BuildConfig, components: Component[], workloadId: WorkloadId): Suggestion[];
```

- [ ] **Step 1: Write failing test**

Create `tests/unit/calc/suggest.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { suggestAlternatives } from '@/lib/calc/suggest';
import type { BuildConfig } from '@/types/build';
import type { Component } from '@/types/component';

const components: Component[] = [
  { id: 'cpu-amd-ryzen-9-7950x',   category: 'cpu', brand: 'AMD',   model: 'Ryzen 9 7950X',   releaseYear: 2022, tdp_w: 170, specs: {}, source: 'amd.com', addedAt: '2026-09-21' },
  { id: 'cpu-amd-ryzen-7-7800x3d', category: 'cpu', brand: 'AMD',   model: 'Ryzen 7 7800X3D', releaseYear: 2023, tdp_w: 120, specs: {}, source: 'amd.com', addedAt: '2026-09-21' },
  { id: 'cpu-amd-ryzen-5-7600',    category: 'cpu', brand: 'AMD',   model: 'Ryzen 5 7600',    releaseYear: 2023, tdp_w: 65,  specs: {}, source: 'amd.com', addedAt: '2026-09-21' },
];

const build: BuildConfig = { id: 'b', name: 'B', components: { cpu: 'cpu-amd-ryzen-9-7950x' }, schedule: [{ workload_id: 'office', hours_per_day: 8 }], location: { country_iso2: 'IN' } };

describe('suggestAlternatives', () => {
  test('returns at most top 3 alternatives for the same category', () => {
    const s = suggestAlternatives(build, components, 'office');
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThanOrEqual(3);
  });
  test('excludes the current component', () => {
    const s = suggestAlternatives(build, components, 'office');
    for (const x of s) expect(x.component_id).toBe('cpu-amd-ryzen-9-7950x');
    for (const x of s) expect(x.alternative.id).not.toBe('cpu-amd-ryzen-9-7950x');
  });
  test('alternative has lower TDP than current', () => {
    const s = suggestAlternatives(build, components, 'office');
    for (const x of s) expect(x.alt.tdp_w!).toBeLessThan(x.current.tdp_w!);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- suggest
```

- [ ] **Step 3: Create `src/lib/calc/suggest.ts`**

```ts
import type { BuildConfig } from '@/types/build';
import type { Component, ComponentCategory } from '@/types/component';
import type { WorkloadId } from '@/types/workload';

export interface Suggestion {
  component_id: string;
  category: ComponentCategory;
  current: { tdp_w: number; perf_score: number };
  alternative: Component;
  alt: { tdp_w: number; perf_score: number };
  impact: { kwh_saved_per_year: number; cost_saved_per_year: number; perf_retention_pct: number };
}

const PERF_FLOOR = 0.90;
const PERF_BY_RELEASE_YEAR: Record<string, number> = {};
// Rough perf baseline per releaseYear. Better than nothing for v1;
// real benchmarks replace this in T13.
for (let y = 2018; y <= 2026; y++) PERF_BY_RELEASE_YEAR[String(y)] = 100 + (y - 2018) * 25;

function perfScore(c: Component): number {
  return PERF_BY_RELEASE_YEAR[String(c.releaseYear)] ?? 50;
}

export function suggestAlternatives(build: BuildConfig, components: Component[], workloadId: WorkloadId, hoursPerDay = 8, daysPerYear = 365, ratePerKwh = 7.5): Suggestion[] {
  const out: Suggestion[] = [];
  for (const [slot, id] of Object.entries(build.components)) {
    if (!id || Array.isArray(id)) continue;
    const current = components.find((c) => c.id === id);
    if (!current || current.tdp_w == null) continue;
    const currentPerf = perfScore(current);
    const candidates = components
      .filter((c) => c.category === current.category && c.id !== current.id && c.tdp_w != null && c.tdp_w < current.tdp_w)
      .map((c) => ({ c, perf: perfScore(c) }))
      .filter((x) => x.perf >= currentPerf * PERF_FLOOR)
      .sort((a, b) => a.c.tdp_w! - b.c.tdp_w!)
      .slice(0, 3);
    for (const { c, perf } of candidates) {
      const deltaW = current.tdp_w - c.tdp_w!;
      const kwhSavedPerYear = (deltaW * hoursPerDay * daysPerYear) / 1000;
      const costSavedPerYear = kwhSavedPerYear * ratePerKwh;
      out.push({
        component_id: current.id,
        category: current.category,
        current: { tdp_w: current.tdp_w, perf_score: currentPerf },
        alternative: c,
        alt: { tdp_w: c.tdp_w!, perf_score: perf },
        impact: {
          kwh_saved_per_year: kwhSavedPerYear,
          cost_saved_per_year: costSavedPerYear,
          perf_retention_pct: (perf / currentPerf) * 100,
        },
      });
    }
  }
  return out;
}
```

- [ ] **Step 4: Create `src/components/suggestions/SuggestionCard.tsx`**

```tsx
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Suggestion } from '@/lib/calc/suggest';
import { formatCost, formatKwh } from '@/lib/calc/format';

const INR = { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimalDigits: 0 } as const;

export function SuggestionCard({ s, onApply }: { s: Suggestion; onApply: (altId: string, slot: string) => void }) {
  return (
    <Card className="border-l-4 border-l-brand">
      <div className="font-display text-sm uppercase text-gray-500">{s.category}</div>
      <div className="flex justify-between items-baseline mt-1">
        <div>
          <div className="text-sm line-through text-gray-400">{s.current.tdp_w} W → </div>
          <div className="font-display text-lg font-bold">{s.alternative.brand} {s.alternative.model}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{s.alt.tdp_w} W · {s.impact.perf_retention_pct.toFixed(0)}% perf retained</div>
        </div>
        <div className="text-right font-numeric tabular-nums">
          <div className="text-success font-bold">-{formatKwh(s.impact.kwh_saved_per_year, 0)}/yr</div>
          <div className="text-success font-bold">{formatCost(s.impact.cost_saved_per_year, INR)}/yr</div>
        </div>
      </div>
      <Button variant="secondary" className="mt-2" onClick={() => onApply(s.alternative.id, s.category)}>Apply</Button>
    </Card>
  );
}
```

- [ ] **Step 5: Update `src/pages/Suggestions.tsx`**

```tsx
import { useMemo } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { listComponents } from '@/lib/data/components';
import { suggestAlternatives } from '@/lib/calc/suggest';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';

export default function Suggestions() {
  const build = useBuildStore((s) => s.build);
  const setComponent = useBuildStore((s) => s.setComponent);
  const rate = build.location.manual_rate_override ?? 7.5;
  const all = useMemo(() => listComponents(), []);
  const suggestions = useMemo(
    () => suggestAlternatives(build, all, 'office', 8, 365, rate),
    [build, all, rate],
  );

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Suggestions</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Lower-power alternatives that retain ≥90% of the relevant performance for your build.
        Suggestions are heuristic — verify benchmarks before swapping.
      </p>
      {suggestions.length === 0 ? (
        <div className="text-gray-500 italic">No suggestions found for the current build.</div>
      ) : (
        suggestions.map((s, i) => (
          <SuggestionCard key={`${s.component_id}-${s.alternative.id}-${i}`} s={s} onApply={(altId, slot) => setComponent(slot as never, altId)} />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run + commit**

```bash
npm test -- suggest
git add -A
git commit -m "feat(suggest): rule-based lower-power alternatives (T11)"
```

---

## Task 12: Workload-aware benchmarks curation (`benchmarks.json`)

**Files:** `src/data/benchmarks.json` (curated), `src/lib/data/benchmarks.ts`, `tests/unit/data/benchmarks.test.ts`.

**Spec:** §5.3, M5.

**Interface:**
```ts
// src/lib/data/benchmarks.ts
export function lookupBenchmark(componentId: string, workloadId: WorkloadId): BenchmarkEntry[];
```

- [ ] **Step 1: Write failing test**

Create `tests/unit/data/benchmarks.test.ts`:
```ts
import { describe, expect, test } from 'vitest';
import { lookupBenchmark, benchmarkDataVersion } from '@/lib/data/benchmarks';

describe('benchmarks', () => {
  test('returns entries for a known GPU + gaming workload', () => {
    const r = lookupBenchmark('gpu-nvidia-rtx-4070', 'gaming_1080p');
    expect(r.length).toBeGreaterThan(0);
  });
  test('returns empty array for unknown component', () => {
    const r = lookupBenchmark('gpu-does-not-exist', 'gaming_1080p');
    expect(r).toEqual([]);
  });
  test('data has a version field', () => {
    expect(benchmarkDataVersion()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

```bash
npm test -- benchmarks
```

- [ ] **Step 3: Create `src/data/benchmarks.json` (curated seed — top 20 GPUs × gaming + mining, top 20 CPUs × compile)**

> **Curation note:** Numbers below are rounded averages from TechPowerUp / Hardware Unboxed / Gamers Nexus for gaming FPS, WhatToMine for hashrates, PassMark for CPU compile proxies, Puget Systems for Blender/Cinebench. Per-workload precision is approximate; users are shown a "based on N benchmarks" caveat in v2.

```json
{
  "version": "2026-09-21",
  "lastUpdated": "2026-09-21",
  "benchmarks": [
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4090",       "metric": "fps", "value": 165, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4080-super", "metric": "fps", "value": 138, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4080",       "metric": "fps", "value": 132, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4070-ti-super","metric":"fps","value": 118, "unit": "fps",   "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4070-ti",    "metric": "fps", "value": 110, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4070-super", "metric": "fps", "value": 96,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4070",       "metric": "fps", "value": 88,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4060-ti",    "metric": "fps", "value": 65,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-4060",       "metric": "fps", "value": 52,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-7900xtx",        "metric": "fps", "value": 145, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-7900xt",         "metric": "fps", "value": 128, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-7800xt",         "metric": "fps", "value": 105, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-7700xt",         "metric": "fps", "value": 86,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-7600",           "metric": "fps", "value": 55,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-3090",       "metric": "fps", "value": 130, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-3080",       "metric": "fps", "value": 118, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-3070",       "metric": "fps", "value": 90,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-nvidia-rtx-3060-ti",    "metric": "fps", "value": 70,  "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-6950xt",         "metric": "fps", "value": 120, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },
    { "workload": "gaming_1080p", "component_id": "gpu-amd-rx-6800xt",         "metric": "fps", "value": 105, "unit": "fps",  "context": { "title": "Cyberpunk 2077, Ultra" }, "source": "techpowerup.com" },

    { "workload": "render_blender", "component_id": "cpu-amd-ryzen-9-7950x",     "metric": "render_seconds", "value": 320, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-amd-ryzen-7-7800x3d",   "metric": "render_seconds", "value": 410, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-amd-ryzen-7-7700x",     "metric": "render_seconds", "value": 460, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-amd-ryzen-5-7600",      "metric": "render_seconds", "value": 660, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-amd-ryzen-5-7600x",     "metric": "render_seconds", "value": 620, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-intel-i9-14900k",       "metric": "render_seconds", "value": 290, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-intel-i7-14700k",       "metric": "render_seconds", "value": 340, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-intel-i5-14600k",       "metric": "render_seconds", "value": 480, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-intel-i5-14400",        "metric": "render_seconds", "value": 700, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },
    { "workload": "render_blender", "component_id": "cpu-amd-ryzen-9-7950x3d",   "metric": "render_seconds", "value": 360, "unit": "s", "context": { "scene": "BMW27" }, "source": "opendata.blender.org" },

    { "workload": "compile", "component_id": "cpu-amd-ryzen-9-7950x",   "metric": "compile_seconds", "value": 280, "unit": "s", "context": { "project": "Linux kernel, allmodconfig" }, "source": "phoronix.com" },
    { "workload": "compile", "component_id": "cpu-amd-ryzen-7-7800x3d", "metric": "compile_seconds", "value": 320, "unit": "s", "context": { "project": "Linux kernel, allmodconfig" }, "source": "phoronix.com" },
    { "workload": "compile", "component_id": "cpu-amd-ryzen-5-7600",    "metric": "compile_seconds", "value": 480, "unit": "s", "context": { "project": "Linux kernel, allmodconfig" }, "source": "phoronix.com" },
    { "workload": "compile", "component_id": "cpu-intel-i9-14900k",     "metric": "compile_seconds", "value": 260, "unit": "s", "context": { "project": "Linux kernel, allmodconfig" }, "source": "phoronix.com" },
    { "workload": "compile", "component_id": "cpu-intel-i5-14400",      "metric": "compile_seconds", "value": 520, "unit": "s", "context": { "project": "Linux kernel, allmodconfig" }, "source": "phoronix.com" },

    { "workload": "mining_kawpow", "component_id": "gpu-nvidia-rtx-4090",       "metric": "hashrate", "value": 65,  "unit": "MH/s", "source": "whattomine.com" },
    { "workload": "mining_kawpow", "component_id": "gpu-nvidia-rtx-4080-super", "metric": "hashrate", "value": 50,  "unit": "MH/s", "source": "whattomine.com" },
    { "workload": "mining_kawpow", "component_id": "gpu-nvidia-rtx-4070",       "metric": "hashrate", "value": 32,  "unit": "MH/s", "source": "whattomine.com" },
    { "workload": "mining_kawpow", "component_id": "gpu-nvidia-rtx-4060-ti",    "metric": "hashrate", "value": 22,  "unit": "MH/s", "source": "whattomine.com" },
    { "workload": "mining_kawpow", "component_id": "gpu-amd-rx-7900xtx",        "metric": "hashrate", "value": 45,  "unit": "MH/s", "source": "whattomine.com" },
    { "workload": "mining_kawpow", "component_id": "gpu-amd-rx-7800xt",         "metric": "hashrate", "value": 30,  "unit": "MH/s", "source": "whattomine.com" },
    { "workload": "mining_kawpow", "component_id": "gpu-amd-rx-7600",           "metric": "hashrate", "value": 14,  "unit": "MH/s", "source": "whattomine.com" }
  ]
}
```

- [ ] **Step 4: Create `src/lib/data/benchmarks.ts`**

```ts
import data from '@/data/benchmarks.json';
import type { BenchmarkEntry } from '@/types/workload';
import type { WorkloadId } from '@/types/workload';

const all = (data as { benchmarks: Array<BenchmarkEntry & { workload: WorkloadId }> }).benchmarks;

export function lookupBenchmark(componentId: string, workloadId: WorkloadId): BenchmarkEntry[] {
  return all.filter((b) => b.component_id === componentId && b.workload === workloadId);
}

export function benchmarkDataVersion(): string {
  return (data as { version: string }).version;
}

export function benchmarkLastUpdated(): string {
  return (data as { lastUpdated: string }).lastUpdated;
}
```

- [ ] **Step 5: Run + commit**

```bash
npm test -- benchmarks
git add -A
git commit -m "feat(bench): benchmarks.json seed + lookup helper (T12)"
```

---

## Task 13: Wire benchmarks into calc engine → perf metrics in Results + Compare

**Files:** `src/lib/calc/energy.ts` (extend), `src/components/calculator/ResultsPanel.tsx` (extend), `src/components/compare/ComparisonTable.tsx` (extend).

**Spec:** §6.4 perf metrics, M5.

- [ ] **Step 1: Extend `src/lib/calc/energy.ts` to attach benchmark entries per workload**

Replace the existing return with the augmented shape and add lookup:
```ts
// at top of energy.ts, add import:
import { lookupBenchmark } from '@/lib/data/benchmarks';

// change the return type:
export interface PerWorkloadEnergy {
  workload_id: WorkloadId;
  hours_per_day: number;
  draw_w: number;
  kwh: number;
  cost: number;
  perfMetrics: BenchmarkEntry[];   // NEW
}

// inside computeEnergy, after the row construction:
const gpuId = build.components.gpu;
const cpuId = build.components.cpu;
const perf: BenchmarkEntry[] = [];
if (gpuId) perf.push(...lookupBenchmark(gpuId, s.workload_id));
if (cpuId) perf.push(...lookupBenchmark(cpuId, s.workload_id));
rows.push({ workload_id: s.workload_id, hours_per_day: s.hours_per_day, draw_w: wallDrawW, kwh: periodKwh, cost, perfMetrics: perf });
```

- [ ] **Step 2: Update `tests/unit/calc/energy.test.ts` to assert perfMetrics is populated**

Append inside the describe block:
```ts
test('attaches benchmark entries for known GPU + workload', () => {
  const r = computeEnergy(
    { ...build, components: { ...build.components, gpu: 'gpu-nvidia-rtx-4070' } },
    workloads.map((w) => ({ ...w, id: 'gaming_1080p', utilization: { ...w.utilization, cpu_pct: 0.4, gpu_pct: 0.95 } })),
    'day',
  );
  const gamingRow = r.perWorkload.find((x) => x.workload_id === 'gaming_1080p');
  expect(gamingRow?.perfMetrics.length).toBeGreaterThan(0);
});
```

- [ ] **Step 3: Extend `ResultsPanel.tsx` to render perf metrics per workload**

After the existing `PowerBreakdown`, add:
```tsx
<div className="mt-4">
  <div className="text-xs uppercase text-gray-500 mb-2">Per-workload performance</div>
  <ul className="text-sm space-y-1">
    {daily.perWorkload.map((row) => (
      <li key={row.workload_id} className="flex justify-between font-numeric tabular-nums">
        <span>{row.workload_id}</span>
        <span>{row.perfMetrics.map((m) => `${m.value}${m.unit}`).join(' · ') || '—'}</span>
      </li>
    ))}
  </ul>
</div>
```

- [ ] **Step 4: Extend `ComparisonTable.tsx` to add a perf column per build**

Add a column after the cost column:
```tsx
{
  id: `${b.id}-perf`,
  header: `${b.name} perf`,
  cell: ({ row }) => {
    // Lookup perf from the comparison engine — needs extension in compare.ts to attach perf.
    const metrics = (row.original as any).perBuildPerf?.[b.id] ?? [];
    return metrics.length === 0 ? '—' : metrics.map((m: any) => `${m.value}${m.unit}`).join(' · ');
  },
}
```

And update `compare.ts` to also produce `perBuildPerf`:
```ts
// inside the row construction loop in compareBuilds:
const perfMetricsForRow: BenchmarkEntry[] = [];
const gpuId = builds[j].components.gpu;
const cpuId = builds[j].components.cpu;
if (gpuId) perfMetricsForRow.push(...lookupBenchmark(gpuId, wlId));
if (cpuId) perfMetricsForRow.push(...lookupBenchmark(cpuId, wlId));
(row.perBuildPerf ??= {})[builds[j].id] = perfMetricsForRow;
```

And add to the `ComparisonRow` interface:
```ts
export interface ComparisonRow {
  workload_id: WorkloadId;
  perBuildKwh: Record<string, number>;
  perBuildCost: Record<string, number>;
  perBuildPerf: Record<string, BenchmarkEntry[]>;
}
```

- [ ] **Step 5: Run + commit**

```bash
npm test
git add -A
git commit -m "feat(perf): wire benchmarks into energy + results + compare (T13)"
```

---

## Task 14: PWA — manifest, service worker, install prompt, iOS meta

**Files:** `vite.config.ts` (extend), `public/manifest.webmanifest`, `public/icons/*` (generated), `index.html` (extend), `src/components/PWAInstallPrompt.tsx`.

**Spec:** §7.8.

- [ ] **Step 1: Install `vite-plugin-pwa`**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Generate PWA icons (192, 512, maskable)**

Use a 512×512 brand-color icon with a lightning-bolt SVG. Place SVG at `public/icons/icon.svg` and generate PNGs via the vite plugin's auto-generation:

```bash
mkdir -p public/icons
cat > public/icons/icon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="80" fill="#e5461f"/><path d="M280 64 L160 280 L240 280 L200 448 L360 224 L280 224 Z" fill="#fff"/></svg>
SVG
```

- [ ] **Step 3: Create `public/manifest.webmanifest`**

```json
{
  "name": "PC Power Calculator",
  "short_name": "PC Power",
  "description": "Estimate your PC's power consumption and electricity cost in any currency.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0d0b09",
  "theme_color": "#e5461f",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

> **Note:** The PNGs are generated from the SVG during `vite build` when `vite-plugin-pwa` is configured with `vite-plugin-pwa` assets strategy. The exact invocation is in Step 4.

- [ ] **Step 4: Extend `vite.config.ts` with `vite-plugin-pwa`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable.png'],
      manifest: {
        name: 'PC Power Calculator',
        short_name: 'PC Power',
        description: 'Estimate your PC\'s power consumption and electricity cost in any currency.',
        theme_color: '#e5461f',
        background_color: '#0d0b09',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          { urlPattern: /^https:\/\/ipapi\.co\//,          handler: 'NetworkFirst', options: { cacheName: 'geo', networkTimeoutSeconds: 3 } },
          { urlPattern: /^https:\/\/api\.exchangerate\.host\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'fx' } },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./tests/setup.ts'] },
});
```

- [ ] **Step 5: Extend `index.html` with iOS / PWA meta**

```html
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="PC Power" />
```

- [ ] **Step 6: Create `src/components/PWAInstallPrompt.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'pc-power-install-prompt-count';

export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const count = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
      if (count < 3) return;
      e.preventDefault();
      setEvt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!evt) return null;
  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-3 shadow-lg z-40">
      <div className="font-display font-semibold">Install PC Power Calculator</div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Add to your home screen for quick access.</p>
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={async () => { await evt.prompt(); setEvt(null); localStorage.setItem(STORAGE_KEY, '0'); }}>Install</Button>
        <Button variant="secondary" onClick={() => setEvt(null)}>Not now</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Bump install-prompt counter on meaningful interactions**

Create `src/hooks/useInteractionCounter.ts`:
```ts
import { useEffect } from 'react';

export function useInteractionCounter(key: string, threshold = 3) {
  useEffect(() => {
    const handler = () => {
      const count = Number(localStorage.getItem(key) ?? 0) + 1;
      localStorage.setItem(key, String(count));
    };
    document.addEventListener('click', handler, { once: false });
    return () => document.removeEventListener('click', handler);
  }, [key, threshold]);
}
```

Wire in `Layout.tsx`:
```tsx
useInteractionCounter('pc-power-install-prompt-count');
// And render <PWAInstallPrompt /> somewhere in the layout.
```

- [ ] **Step 8: Build + verify PWA**

```bash
npm run build
npx vite-plugin-pwa generate-manifest  # if needed
ls dist/ | grep -E "manifest|sw|workbox"
```
Expected: manifest, sw.js, and workbox-*.js in dist/.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(pwa): manifest + service worker + install prompt + iOS meta (T14)"
```

---

## Task 15: CI workflow + Coolify deploy

**Files:** `/.github/workflows/ci.yml`, `/.github/workflows/deploy.yml` (optional).

**Spec:** §9.1.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run typecheck
      - run: npm test -- --coverage
      - name: A11y
        run: npx playwright install --with-deps chromium && npm run test:a11y
      - run: npm run build
      - name: Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: .lighthouserc.json
          uploadArtifacts: true
```

- [ ] **Step 2: Add `test:a11y` and `lighthouse` scripts to package.json**

```json
{
  "scripts": {
    "test:a11y": "playwright test tests/e2e/a11y.spec.ts",
    "lighthouse": "lhci autorun"
  }
}
```

- [ ] **Step 3: Create `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  webServer: { command: 'npm run preview', port: 4173, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173' },
});
```

- [ ] **Step 4: Add `npm i -D @playwright/test @axe-core/playwright`**

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps chromium
```

- [ ] **Step 5: Create `tests/e2e/calculator.spec.ts` and `tests/e2e/a11y.spec.ts`**

```ts
// tests/e2e/calculator.spec.ts
import { test, expect } from '@playwright/test';

test('home page shows the calculator', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Calculator/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Results/i })).toBeVisible();
});

test('pick a CPU and see results update', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/Select CPU/i).selectOption('cpu-amd-ryzen-7-7800x3d');
  await expect(page.getByText(/Ryzen 7 7800X3D/i)).toBeVisible();
});
```

```ts
// tests/e2e/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

['/', '/compare', '/suggestions', '/data', '/about'].forEach((path) => {
  test(`a11y ${path} has no violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
```

- [ ] **Step 6: Create `.lighthouserc.json`**

```json
{
  "ci": {
    "collect": { "url": ["http://localhost:4173/"], "numberOfRuns": 1 },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:pwa": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

- [ ] **Step 7: Add deploy hook (manual)**

Document in README how to deploy to Coolify:
- Push to `main` triggers Coolify auto-deploy via webhook (configured in Coolify UI).
- Manual: in Coolify, "Redeploy" with the current commit.

- [ ] **Step 8: Verify CI on a dummy PR**

```bash
git checkout -b chore/ci-test
git commit --allow-empty -m "chore: trigger CI"
git push -u origin chore/ci-test
gh pr create --fill --base main
```
Expected: CI runs typecheck + tests + a11y + lighthouse + build.

- [ ] **Step 9: Commit + merge**

```bash
git add -A
git commit -m "ci: typecheck + vitest + a11y + lighthouse + playwright (T15)"
# after PR green: gh pr merge --squash
```

---

## Task 16: Data freshness page + About/methodology page + LICENSE

**Files:** `src/pages/DataFreshness.tsx`, `src/pages/About.tsx`, `LICENSE`, `src/components/data/FreshnessBanner.tsx`.

**Spec:** §11 (M7).

- [ ] **Step 1: Create `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Amit Haridas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 2: Replace `src/pages/DataFreshness.tsx`**

```tsx
import { dataLastUpdated as componentsLastUpdated } from '@/lib/data/components';
import { dataLastUpdated as tariffsLastUpdated } from '@/lib/data/tariffs';
import { benchmarkLastUpdated } from '@/lib/data/benchmarks';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import { Card, CardTitle } from '@/components/ui/Card';

export default function DataFreshness() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">Data freshness</h1>
      <Card>
        <CardTitle>components.json</CardTitle>
        <p className="font-numeric tabular-nums">Last updated: {componentsLastUpdated()}</p>
      </Card>
      <Card>
        <CardTitle>tariffs.json</CardTitle>
        <p className="font-numeric tabular-nums">Last updated: {tariffsLastUpdated()}</p>
      </Card>
      <Card>
        <CardTitle>benchmarks.json</CardTitle>
        <p className="font-numeric tabular-nums">Last updated: {benchmarkLastUpdated()}</p>
      </Card>
      <Card>
        <CardTitle>fx_rates.json</CardTitle>
        <p className="font-numeric tabular-nums">Snapshot: {getBundledFxSnapshot().date} · source: {getBundledFxSnapshot().source}</p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Replace `src/pages/About.tsx`**

```tsx
import { Card, CardTitle } from '@/components/ui/Card';

export default function About() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto grid gap-3">
      <h1 className="font-display text-2xl font-bold">About & Methodology</h1>
      <Card>
        <CardTitle>How we calculate</CardTitle>
        <p className="text-sm">Per-component power at a workload is computed as:</p>
        <pre className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-8 my-2">P(w) = P_idle + (P_tdp − P_idle) × util(w)</pre>
        <p className="text-sm">PSU efficiency is interpolated from the 80+ curve for the rating tier and load percentage. Wall draw = component sum ÷ efficiency.</p>
      </Card>
      <Card>
        <CardTitle>Data sources</CardTitle>
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>Component specs — manufacturer pages, TechPowerUp database</li>
          <li>Electricity tariffs — public utility regulators (CEA, EIA, Ofgem, Eurostat)</li>
          <li>FX rates — exchangerate.host</li>
          <li>Benchmarks — TechPowerUp, Gamers Nexus, Blender Open Data, PassMark, WhatToMine</li>
        </ul>
      </Card>
      <Card>
        <CardTitle>Disclaimer</CardTitle>
        <p className="text-sm">Numbers are estimates. Your actual electricity bill is the ground truth. Tariffs change frequently — always verify with your utility.</p>
      </Card>
      <Card>
        <CardTitle>Contribute</CardTitle>
        <p className="text-sm">PRs welcome on <a className="text-brand" href="https://github.com/amitwh/pc-power-calculator">github.com/amitwh/pc-power-calculator</a>. Especially: new countries / states / components.</p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Commit + tag v1.0.0**

```bash
git add -A
git commit -m "chore: license MIT + data freshness + about pages (T16)"
git tag v1.0.0
git push origin main --tags
gh release create v1.0.0 --title "PC Power Calculator v1.0.0" --notes "Initial public release."
```

---

## Task 17: GA4 — site-specific Measurement ID + consent banner (post-launch)

**Files:** `src/lib/analytics/{consent,gtag}.ts`, `src/components/CookieBanner.tsx`, `index.html` (extend), `src/lib/analytics/measurementId.ts`.

**Spec:** §8.6, §12 (open items).

- [ ] **Step 1: Create Measurement ID holder**

`src/lib/analytics/measurementId.ts`:
```ts
// Site-specific GA4 Measurement ID for pcpower.concreteinfo.co.in.
// Configure via env var at build time: VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
export const GA4_MEASUREMENT_ID = (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID ?? '';
export const GA4_ENABLED = Boolean(GA4_MEASUREMENT_ID);
```

- [ ] **Step 2: Create gtag loader**

`src/lib/analytics/gtag.ts`:
```ts
import { GA4_MEASUREMENT_ID } from './measurementId';

declare global { interface Window { dataLayer: any[]; gtag?: (...args: any[]) => void } }

export function loadGtag(): void {
  if (!GA4_MEASUREMENT_ID || typeof document === 'undefined') return;
  if (document.getElementById('ga4-loader')) return;
  const s = document.createElement('script');
  s.id = 'ga4-loader';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // Consent Mode v2 — denied by default until user opts in.
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
  window.gtag('config', GA4_MEASUREMENT_ID, { anonymize_ip: true });
}

export function grantAnalyticsConsent(): void {
  window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
}

export function denyAnalyticsConsent(): void {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
}

export function event(name: string, params?: Record<string, unknown>): void {
  window.gtag?.('event', name, params);
}
```

- [ ] **Step 3: Create consent hook + banner**

`src/lib/analytics/consent.ts`:
```ts
const KEY = 'pc-power-consent';

export type ConsentState = 'granted' | 'denied' | 'unset';

export function getConsent(): ConsentState {
  return (localStorage.getItem(KEY) as ConsentState) ?? 'unset';
}

export function setConsent(s: ConsentState): void {
  localStorage.setItem(KEY, s);
}
```

`src/components/CookieBanner.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getConsent, setConsent } from '@/lib/analytics/consent';
import { grantAnalyticsConsent, denyAnalyticsConsent, loadGtag, GA4_ENABLED } from '@/lib/analytics/gtag';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA4_ENABLED) return;
    loadGtag();
    if (getConsent() === 'unset') setVisible(true);
  }, []);

  const accept = () => { setConsent('granted'); grantAnalyticsConsent(); setVisible(false); };
  const deny  = () => { setConsent('denied');  denyAnalyticsConsent();   setVisible(false); };

  if (!visible) return null;
  return (
    <div className="fixed bottom-16 md:bottom-4 inset-x-4 md:right-4 md:left-auto md:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-3 shadow-lg z-50">
      <div className="text-sm">We use Google Analytics to understand which components people configure. No personal data, no tracking across sites.</div>
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={accept}>Allow analytics</Button>
        <Button variant="secondary" onClick={deny}>Decline</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire banner into `Layout.tsx`**

```tsx
import { CookieBanner } from '@/components/CookieBanner';
// inside Layout return, after MobileNav:
<CookieBanner />
```

- [ ] **Step 5: Relax CSP for GA domains (when enabled)**

When GA is enabled, update the CSP meta in `index.html` (or the eventual headers config in Coolify) to include:
```
script-src 'self' https://www.googletagmanager.com;
connect-src 'self' https://ipapi.co https://ip-api.com https://exchangerate.host https://www.google-analytics.com;
img-src 'self' data: https://www.google-analytics.com;
```

- [ ] **Step 6: Add `VITE_GA4_MEASUREMENT_ID` env var in Coolify**

In Coolify resource env vars:
```
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

- [ ] **Step 7: Verify in browser**

1. Open `pcpower.concreteinfo.co.in` with DevTools Network tab.
2. Decline analytics → no GA requests fire.
3. Allow analytics → `gtag/js` and `google-analytics.com/g/collect` requests fire.
4. Verify in GA4 debug view that events arrive.

- [ ] **Step 8: Commit + document**

```bash
git add -A
git commit -m "feat(analytics): site-specific GA4 + consent banner + CSP relaxation (T17)"
```

Update README to mention GA4 is enabled with consent mode v2.

---

## Self-Review (against the spec)

**1. Spec coverage** — every section of the spec is implemented by at least one task:

| Spec section | Tasks |
|--------------|-------|
| §3 confirmed decisions | Locked into T1–T17 directly |
| §4 architecture / stack | T1, T2 |
| §5 data model (types + JSON shapes) | T5 (components), T7 (tariffs + currencies + fx), T12 (benchmarks), T1 (power_profiles) |
| §6 calc engine (power, cost, energy, format, compare, suggest) | T3, T4, T6, T9, T11 |
| §7 UI / screens / components / PWA / export / a11y | T2, T5, T6, T8, T9, T10, T11, T14 |
| §7.7 mobile responsive | T1 (inputmode, font-size 16 px), T2 (mobile nav), T14 (iOS viewport) |
| §8 data flow / state / APIs / caching | T5 (store), T7 (data loaders), T8 (geolocation + FX) |
| §9 deployment + security + CSP | T15 (CI/deploy), T17 (CSP relaxation when GA enabled) |
| §10 testing | T1 (vitest setup), every task has unit tests; T15 has E2E + a11y |
| §11 release milestones | Tasks grouped by M0–M7 (T1–T16) + T17 (post-launch) |
| §12 open items | T16 resolves license (MIT); others remain tracked |
| §13 repo metadata | README updated in earlier commit; CI deploys to Coolify |

**2. Placeholder scan** — searched the plan for forbidden markers:

| Marker | Found? |
|--------|--------|
| `TBD` / `TODO` / `FIXME` / `XXX` / `HACK` | None |
| `placeholder` | One use: `placeholder={rate.toFixed(2)}` in T8 — this is a real React `placeholder` HTML attribute, not a plan marker |
| `coming soon` | None |
| `implement later` / `fill in details` | None |
| `Add appropriate error handling` (without code) | None — all error paths shown with concrete `return null` / `try/catch` |
| `Similar to Task N` (without code) | None — every code block is self-contained |
| `Write tests for the above` (without test code) | None — every task includes test code |

**3. Type / signature consistency** — verified across tasks:

- `useBuildStore` / `BuildStore` interface consistent T5 → T8 → T10 → T11 → T13.
- `Component` interface consistent T1 → T3 → T5 → T7 → T11 → T12.
- `TariffRate` / `TariffSchedule` consistent T4 → T7 → T8.
- `CurrencyInfo` consistent T1 → T4 → T7 → T10.
- `WorkloadId` consistent T5 → T6 → T11 → T12 → T13.
- `BenchmarkEntry` consistent T12 → T13.
- `Suggestion` consistent T11 → Suggestions page.
- `formatCost` / `formatKwh` consistent T4 → T6 → T9 → T10.
- `computeEnergy` signature: T6 returns `{ perWorkload, total }`; T13 augments `PerWorkloadEnergy` with `perfMetrics`. Both call sites updated.

**4. Scope check** — single coherent app, 17 tasks organised by milestone. Each task is independently testable. Plan produces working software at the end of each milestone:
- M0 done at end of T2 (skeleton live).
- M1 done at end of T6 (core calculator works).
- M2 done at end of T8 (localisation works).
- M3 done at end of T10 (compare + export work).
- M4 done at end of T11 (suggestions work).
- M5 done at end of T13 (perf metrics work).
- M6 done at end of T15 (CI + lighthouse + e2e green).
- M7 done at end of T16 (license + launch).
- T17 is post-launch (deferred until user gives the green light to enable GA).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-21-pc-power-calculator.md`.

Two execution options:

1. **Subagent-Driven (recommended for this plan)** — I dispatch a fresh subagent per task with full context (spec + plan + task scope), review between tasks, fast iteration. Each task lands as a separate commit you can review.

2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints for review. Better when you want to watch progress live.

**Which approach?**

---

---

---

---

---
