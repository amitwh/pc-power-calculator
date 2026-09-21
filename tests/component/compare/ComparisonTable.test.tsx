/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import type { BuildConfig } from '@/types/build';

const a: BuildConfig = {
  id: 'a',
  name: 'AMD rig',
  components: { cpu: 'cpu-amd-ryzen-7-7800x3d' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};
const b: BuildConfig = {
  id: 'b',
  name: 'Intel rig',
  components: { cpu: 'cpu-intel-i9-14900k' },
  tdpOverrides: {},
  schedule: [{ workload_id: 'office', hours_per_day: 8 }],
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};

beforeEach(() => {
  // No-op; ComparisonTable reads no store state — but keep the hook so future
  // tests can use it without having to remember the import.
});

describe('ComparisonTable', () => {
  test('renders a header row per build (kWh + cost) and a Workload column', () => {
    render(<ComparisonTable builds={[a, b]} />);
    expect(screen.getByRole('columnheader', { name: /Workload/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /AMD rig \(kWh\)/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /AMD rig \(cost\)/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Intel rig \(kWh\)/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Intel rig \(cost\)/i })).toBeInTheDocument();
  });

  test('Intel build (125 W) draws more yearly kWh than AMD (120 W) at 50% util', () => {
    render(<ComparisonTable builds={[a, b]} />);
    const table = screen.getByRole('table');
    // The footer row "Yearly total" exposes both builds' yearly kWh side by side.
    // Per-build columns are: kWh, cost, perf — so AMD kWh sits at cells[1] and
    // Intel kWh at cells[4].
    const footer = within(table).getAllByText(/Yearly total/i)[0].closest('tr')!;
    const cells = within(footer).getAllByRole('cell');
    const amdkwh = cells[1].textContent ?? '';
    const intelkwh = cells[4].textContent ?? '';
    const parse = (s: string) => Number(s.replace(/[^\d.]/g, ''));
    expect(parse(intelkwh)).toBeGreaterThan(parse(amdkwh));
  });

  test('uses the provided currency for the cost cells (INR with ₹ symbol by default)', () => {
    render(<ComparisonTable builds={[a, b]} />);
    expect(screen.getAllByText(/₹/).length).toBeGreaterThan(0);
  });
});
