/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ComparisonTable } from '@/components/compare/ComparisonTable';
import { buildStats } from '@/lib/calc/buildStats';
import { currencyForLocation } from '@/lib/data/tariffs';
import { findCurrency } from '@/lib/data/currencies';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import { formatCost, formatKwh } from '@/lib/calc/format';
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

const inr = currencyForLocation('IN');
const snapshot = getBundledFxSnapshot();
const stats = [a, b].map((build) => buildStats(build, inr, snapshot));

/** The metric row (rowheader + A / B / difference cells). */
function rowFor(label: string): HTMLElement {
  const table = screen.getByRole('table');
  return within(table).getByRole('rowheader', { name: label }).closest('tr')!;
}

describe('ComparisonTable', () => {
  test('renders System A, System B and Difference columns', () => {
    render(<ComparisonTable stats={stats} displayCurrency={inr} fxSnapshot={snapshot} />);
    expect(screen.getAllByTestId('compare-system')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: /System A/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /System B/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Difference/i })).toBeInTheDocument();
  });

  test('shows the five comparison rows once each in the desktop table', () => {
    render(<ComparisonTable stats={stats} displayCurrency={inr} fxSnapshot={snapshot} />);
    const table = screen.getByRole('table');
    for (const label of ['Energy / year', 'Cost / year', 'Peak draw', 'PSU needed', 'Devices']) {
      expect(within(table).getByRole('rowheader', { name: label })).toBeInTheDocument();
    }
  });

  test('reports the values from buildStats and a signed B − A delta', () => {
    render(<ComparisonTable stats={stats} displayCurrency={inr} fxSnapshot={snapshot} />);
    const [amd, intel] = stats;

    const energy = within(rowFor('Energy / year')).getAllByRole('cell');
    expect(energy[0]).toHaveTextContent(formatKwh(amd.kwhYear, 0));
    expect(energy[1]).toHaveTextContent(formatKwh(intel.kwhYear, 0));
    expect(energy[2].textContent).toMatch(/^\+\d+ kWh$/);

    const cost = within(rowFor('Cost / year')).getAllByRole('cell');
    expect(cost[0]).toHaveTextContent(formatCost(amd.costYear, inr));
    expect(cost[1]).toHaveTextContent(formatCost(intel.costYear, inr));
    expect(cost[2].textContent).toMatch(/^\+₹[\d,.]+$/);

    const devices = within(rowFor('Devices')).getAllByRole('cell');
    expect(devices[0]).toHaveTextContent(String(amd.deviceCount));
    expect(devices[1]).toHaveTextContent(String(intel.deviceCount));
  });

  test('shows the installed-PSU shortfall as a muted note under the PSU row', () => {
    const weakPsu: BuildConfig = {
      id: 'weak',
      name: 'Underpowered rig',
      components: {
        cpu: 'cpu-intel-i9-14900k',
        gpu: 'gpu-nvidia-rtx-4090',
        psu: 'psu-antec-truepower-430w',
      },
      tdpOverrides: {},
      schedule: [{ workload_id: 'office', hours_per_day: 8 }],
      location: { country_iso2: 'IN' },
    };
    const weakStats = [weakPsu, b].map((build) => buildStats(build, inr, snapshot));
    expect(weakStats[0].installedPsuW).toBe(430);
    expect(weakStats[0].installedPsuW).toBeLessThan(weakStats[0].recommendedPsuW);

    render(<ComparisonTable stats={weakStats} displayCurrency={inr} fxSnapshot={snapshot} />);
    const table = screen.getByRole('table');
    expect(within(table).getByText(/Installed 430 W PSU is below the \d+ W recommendation/)).toBeInTheDocument();
  });

  test('puts the currency conversion note once, under the table', () => {
    const usd = findCurrency('USD')!;
    const convertedStats = [a, b].map((build) => buildStats(build, usd, snapshot));
    expect(convertedStats.every((s) => s.converted)).toBe(true);

    render(<ComparisonTable stats={convertedStats} displayCurrency={usd} fxSnapshot={snapshot} />);
    expect(screen.getAllByText(/Costs converted to USD at bundled FX rates/)).toHaveLength(1);
  });
});
