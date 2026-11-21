/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonScales } from '@/components/compare/ComparisonScales';
import type { BuildStats } from '@/lib/calc/buildStats';
import type { CurrencyInfo } from '@/types/currency';

const inr: CurrencyInfo = { code: 'INR', symbol: '₹', name: 'Indian Rupee' } as CurrencyInfo;

const stats: BuildStats[] = [
  {
    id: 'a', name: 'Gaming rig', kwhYear: 488, costYear: 2986, converted: false,
    peakWallDrawW: 344, recommendedPsuW: 500, installedPsuW: 850, deviceCount: 4,
  },
  {
    id: 'b', name: 'Office mini', kwhYear: 172, costYear: 1053, converted: false,
    peakWallDrawW: 124, recommendedPsuW: 300, installedPsuW: null, deviceCount: 2,
  },
];

describe('ComparisonScales', () => {
  test('shows one scaled pair per metric', () => {
    render(<ComparisonScales stats={stats} displayCurrency={inr} />);
    expect(screen.getByRole('heading', { name: /Side by side, to scale/i })).toBeInTheDocument();
    for (const label of ['Energy per year', 'Cost per year', 'Peak draw at the wall', 'PSU size needed']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test('states the gap on B rather than making the reader measure bars', () => {
    render(<ComparisonScales stats={stats} displayCurrency={inr} />);
    // 172 vs 488 kWh is −65%, and the cost row rounds to the same gap.
    expect(screen.getAllByText('−65% on B').length).toBeGreaterThan(0);
    // 300 vs 500 W is −40%.
    expect(screen.getByText('−40% on B')).toBeInTheDocument();
  });

  test('says identical when the rounded values match', () => {
    const twin = [{ ...stats[0] }, { ...stats[1], kwhYear: 488, costYear: 2986, peakWallDrawW: 344, recommendedPsuW: 500 }];
    render(<ComparisonScales stats={twin} displayCurrency={inr} />);
    expect(screen.getAllByText('identical').length).toBe(4);
  });
});
