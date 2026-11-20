# Trust core — accuracy fixes before publishing more numbers

**Date:** 2026-11-20
**Status:** approved direction (user: "go as per your recommendation")
**Scope:** Projects 1 of 4 in the public-success program. No SEO surface ships until this lands.

## Why

The calculator's numbers are the product. Every page, share link and guide added later
inherits them, and a published figure that understates a real electricity bill is the
kind of error a forum thread finds in an afternoon.

Three defects currently bias results:

1. **Off-schedule time is free.** `computeEnergy` prices only scheduled rows
   (`src/lib/calc/energy.ts:176-211`). A machine that is on for 24 h but games for 4
   is billed 4 h. The app's own guide (`src/pages/Guides.tsx:56`) states idle time
   costs more than gaming.
2. **Monitors run through the PSU.** `systemPowerW` (`src/lib/calc/power.ts:61-80`)
   sums every component and divides the total by PSU efficiency. Monitors are
   powered from the wall, so a 60 W panel is reported as ~70 W at 80 PLUS Gold.
   The same error inflates PSU sizing, which is derived from wall draw.
3. **Idle state has no first-class representation.** `utilization.monitor_w`
   (`src/types/workload.ts:30`) is declared and never read.

## Goals

- Price the hours the machine is powered on but idle.
- Report monitor draw at the wall, outside the PSU.
- Size the PSU from component draw, not wall draw.
- Keep every existing persisted build and test valid (absent fields behave as today).

## Non-goals

- Fixed monthly connection charges (billed per connected load, not attributable to
  one PC; the app prices energy only). Documented, not implemented.
- Measured-wattage calibration from a plug meter (Project 3).
- Time-of-use / off-peak tariffs (separate data + UI work).

## Design

### 1. Electrical boundary (`src/lib/calc/power.ts`)

`systemPowerW` gains an explicit wall-side split.

```ts
export const IDLE_UTILIZATION = { cpu: 0, gpu: 0, ram: 0, storage: 0 };

systemPowerW(components, utilization, psuRating, psuWattage = 650,
             options: { includeMonitors?: boolean } = {})
  => { componentDrawW, wallDirectW, wallDrawW }
```

- `WALL_SIDE_CATEGORIES = new Set(['monitor'])` — summed into `wallDirectW`,
  never divided by efficiency.
- `componentDrawW` = PSU-side sum only (documented change in the JSDoc).
- `wallDrawW` = `componentDrawW / psuEfficiency(load) + wallDirectW`, where load %
  is computed from **PSU-side draw only**.
- `includeMonitors: false` drops monitors entirely (they sleep when the PC idles).

### 2. PSU sizing (`src/hooks/useCalc.ts`)

`recommendPsuW` is documented as taking "peak component draw" but is currently fed
wall draw. Pass `componentDrawW` from the all-at-100% call instead. Monitors
therefore stop inflating the recommendation.

### 3. Idle baseline

- `BuildConfig.idle_hours_per_day?: number` (default absent → 0, so persisted builds
  are unchanged).
- `computeEnergy` adds one synthetic row after the schedule rows:
  - hours = `min(max(0, idle_hours_per_day), max(0, 24 - Σ scheduled hours_per_day))`
  - draw = `systemPowerW(comps, IDLE_UTILIZATION, …, { includeMonitors: false })`
  - id = `'idle'`; `perfMetrics: []`.
- Row type: `export type EnergyRowId = WorkloadId | 'idle'` in
  `src/types/workload.ts`; `PerWorkloadEnergy.workload_id` becomes `EnergyRowId`
  (`WorkloadId` itself stays free of a phantom id).

### 4. UI (`ScheduleEditor`)

A permanent idle row under the workload list: range 0…`remaining`, step 0.5,
label "On but idle (desktop / browsing)", with the same kWh/yr + cost readout as
workload rows and the same 24 h budget accounting (`dailyHours` includes idle).

### 5. Store

`setIdleHoursPerDay(hours: number)` on the active build; clamped 0–24.

### 6. Labels

`workloadLabel(id)` in `src/lib/data/workloads.ts` returns "Idle / desktop" for
`'idle'`, else the workload name, else the raw id. Used by `ResultsBreakdown` and
`ExportMenu`.

## Acceptance

- New unit tests: monitor excluded from PSU loss; idle row hours/consumption;
  idle clipped by the 24 h budget; idles uses idle draw, not workload draw;
  absent `idle_hours_per_day` leaves totals byte-identical.
- `npm test` green, `npm run typecheck` clean, no new lint errors.
- At 100% utilization with a monitor, PSU recommendation equals the no-monitor case.
