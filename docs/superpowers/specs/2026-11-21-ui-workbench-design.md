# UI redesign — Workbench (Calculator + Compare)

Date: 2026-11-21
Status: approved direction (option C, scope limited to `/` and `/compare`)

## Why

The calculator answers a search query — "what does my PC cost to run" — but the
answer is not on the first screen. On a 390×844 viewport the first result appears
about 1,300 px down, behind three input cards. The same annual total is rendered
three to four times, with two different roundings (17.5 and 18 kWh on the same
page). Four cards carry identical visual weight, six `h2`s are the same size, and
there is no visible page title. Ten range sliders and thirty `text-xs` labels fill
the rest.

The diagnosis is structural: no hierarchy, duplicated figures, and inline
instructions standing in for progressive disclosure.

## Goals

- The answer is visible in the first viewport at 1440px **and** 390px.
- Every number appears exactly once.
- Inputs are grouped into three named zones, each with one job.
- One card primitive, one button primitive, one field primitive.
- No instruction prose on the working surface; guidance lives in empty states.

## Non-goals

- No change to the calculation engine, catalog, tariffs, or URLs.
- No new routes. Content pages (`/suggestions`, `/data`, `/about`, `/privacy`,
  guides, parts, cost) keep their current layout for now; they already share the
  card system and will inherit the new primitives.
- No dark-mode toggle. Tailwind 4 now follows the OS by default.

## Approaches considered

1. **A — Answer first.** Hero cost, three quiet input cards, analysis below.
   Best for search traffic; minimal chrome.
2. **B — Three steps.** Wizard: system → usage → result. Kindest to newcomers,
   adds a click tax for repeat visitors.
3. **C — Workbench.** Section rail + work area + sticky results rail. Everything
   stays visible, strictly zoned.

**Chosen: C.** The tool's value is comparing and iterating ("what if I game two
hours less?"). B hides the numbers while editing; A is elegant but still makes the
user scroll between an input and its effect. C keeps the result permanently in
view and uses zoning — not hiding — to create hierarchy.

## The design

### Layout, ≥1024px

```
┌ TopNav ──────────────────────────────────────────────────┐
│ What does your PC cost to run?      [My build ▾] ✎  + System │
┌ inputs ───────────────────────────┐ ┌ answer 320–360px ──┐
│ Parts    (3 controls, 1 row)      │ │ YEARLY COST        │
│ Usage    (one 36px line each)     │ │ ₹2,577 / yr        │
│ Rate     (country·state·rate·cur) │ │ kWh · print/month  │
│                                   │ │ PSU · peak · Share │
└───────────────────────────────────┘ └────────────────────┘
┌ Power draw breakdown ┐ ┌ Per-workload usage ┐   (below fold)
```

- **No section rail.** The left rail cost 176 px of width and carried nothing
  that the cards themselves did not say. Section anchors went with the stacked
  layout. The build switcher is one `<select>` plus rename / delete / add in the
  title row.
- **Inputs: three cards, one screen.** Target: parts + usage + rate + the answer
  all visible at 800 px viewport height without scrolling. Measured 900 px tall
  at 1440×900 with four parts selected.
- **Answer column** — `position: sticky`, so the number stays in view while the
  part list grows.
- **Analysis sits below the fold** — chart and per-workload table are supporting
  detail, and they render nothing at all until a part exists.

### Layout, <1024px

Single column with the answer first (`order: -1`) so the yearly figure is never
below the fold. Part rows wrap to a name line plus a controls line; the
per-workload cost column hides below `sm`.

### Components

- **System card** — part rows (category dot, name, sub-line with wattage, quantity
  stepper only when > 1, remove). A single `+ Add part` button expands the catalog
  search. System-type and category filter move inside that expander.
- **Usage card** — a table of four workload rows with `− value +` steppers for
  hours/day and days/week, plus a proportion bar. No full-width sliders.
- **Tariff card** — 2×2 field grid (country, state, rate, currency). Tariff
  metadata collapses to one line.
- **Analysis card** — donut and per-workload table side by side; rendered only when
  there is at least one part (no empty chart).
- **Results rail** — yearly figure (the emphasis), month/day/peak trio, PSU
  recommendation with its one-line rationale, share/export, and a compact
  all-systems list only when more than one build exists.
- **Empty state** — a single call to action ("Add your first part") that opens the
  picker. Not a three-step tutorial.

### Typography

The interface uses the **standard system UI stack** — `system-ui, -apple-system,
'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` — for body, display and
numerals, with `ui-monospace` for code-ish figures.

- Superseded an intermediate phase that shipped self-hosted Geist; that variable
  font read poorly at this size and added a webfont download for no benefit.
- No webfont means no third-party font request, no font swap and therefore no
  CLS from late text reflow. The CSP keeps `font-src 'self'` and the precache
  glob no longer lists `woff2` because none is emitted.
- Numerals stay `tabular-nums`, which the system fonts support, so columns of
  money still align.

## Visual rules

- Accent (`brand`) is reserved for: the primary action, the headline number, and
  the active rail item. Nothing else.
- Section headings are 12px uppercase, muted; card titles are 13–15px semibold in
  ink. One heading level per card.
- All controls share a 40px minimum height and one border token.
- Numerals use tabular figures everywhere.

## What the builder must decide

- Whether the section anchors scroll or filter (recommendation: scroll to the
  section; all four stay mounted so state is never lost).
- Exact stepper increments (hours: 1 h; days: 1 d).
- Whether the Analysis card stays in the work area or moves into the results rail
  on very wide screens (recommendation: stay in the work area).

## Verification

- First viewport at 390×844 shows the yearly figure.
- `grep` the rendered Home for duplicate yearly values — exactly one.
- Existing tests updated: `ScheduleEditor` (sliders → steppers), `BuildPicker`
  (chips removed), `ResultsPanel`, `AllSystemsSummary` conditional, `Home`,
  `Compare`, plus the a11y suite and the hydration/prerender tests.
