/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompareVerdict } from '@/components/compare/CompareVerdict';
import { buildStats } from '@/lib/calc/buildStats';
import { currencyForLocation } from '@/lib/data/tariffs';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import { formatCost } from '@/lib/calc/format';
import type { BuildConfig } from '@/types/build';

const inr = currencyForLocation('IN');
const snapshot = getBundledFxSnapshot();

const schedule: BuildConfig['schedule'] = [{ workload_id: 'office', hours_per_day: 8 }];

const base = {
  tdpOverrides: {},
  schedule,
  location: { country_iso2: 'IN', manual_rate_override: 7.5 },
};

function statsFor(builds: BuildConfig[]) {
  return builds.map((build) => buildStats(build, inr, snapshot));
}

describe('CompareVerdict', () => {
  test('leads with the saving and marks exactly one system as cheaper to run', () => {
    const a: BuildConfig = { ...base, id: 'a', name: 'AMD rig', components: { cpu: 'cpu-amd-ryzen-7-7800x3d' } };
    const b: BuildConfig = { ...base, id: 'b', name: 'Intel rig', components: { cpu: 'cpu-intel-i9-14900k' } };
    const stats = statsFor([a, b]);
    const costSaved = stats[1].costYear - stats[0].costYear;

    render(<CompareVerdict stats={stats} displayCurrency={inr} />);

    expect(screen.getByText(/less per year/)).toBeInTheDocument();
    expect(screen.getByText(formatCost(costSaved, inr))).toBeInTheDocument();
    expect(screen.getByText(/less energy/)).toBeInTheDocument();
    expect(screen.getAllByText(/cheaper to run/i)).toHaveLength(1);
  });

  test('says the two cost about the same when the gap is a rounding hair', () => {
    const a: BuildConfig = { ...base, id: 'a', name: 'Rig one', components: { cpu: 'cpu-amd-ryzen-7-7800x3d' } };
    const b: BuildConfig = { ...base, id: 'b', name: 'Rig two', components: { cpu: 'cpu-amd-ryzen-7-7800x3d' } };

    const stats = statsFor([a, b]);
    render(<CompareVerdict stats={stats} displayCurrency={inr} />);

    expect(screen.getByText(/cost about the same to run/i)).toBeInTheDocument();
    expect(screen.queryByText(/less per year/)).not.toBeInTheDocument();
    expect(screen.queryAllByText(/cheaper to run/i)).toHaveLength(0);
  });
});
