/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import {
  buildCategoryLabel,
  deviceCategoryLabel,
  money,
  pdfKwh,
  pdfNum,
  reconciledTotals,
  sumRounded,
  type PdfDeviceRow,
  type PdfReport,
  type PdfScheduleRow,
} from '@/lib/export/report';
import { findCurrency } from '@/lib/data/currencies';
import type { CurrencyInfo } from '@/types/currency';

const inr: CurrencyInfo = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  locale: 'en-IN',
  decimalDigits: 2,
};

/** A report whose schedule carries the given annual costs, for total tests. */
function reportWithCosts(costs: number[]): PdfReport {
  const schedule: PdfScheduleRow[] = costs.map((costYear, i) => ({
    name: `Use case ${i + 1}`,
    hoursPerDay: 1,
    daysPerWeek: 7,
    drawW: 100,
    kwhYear: 100,
    costYear,
  }));
  return {
    buildName: 'Fixture',
    locationLabel: 'Kerala, India',
    tariffLabel: 'Manual override — 7.50 INR/kWh',
    currency: inr,
    devices: [],
    typicalComponentW: 0,
    idleWallW: 0,
    psu: {
      name: null,
      ratedW: null,
      certification: null,
      efficiencyAtLoad: null,
      recommendedW: 0,
      peakComponentW: 0,
      peakWallW: 0,
    },
    schedule,
    totals: {
      daily: { kwh: 0, cost: 0 },
      monthly: { kwh: 0, cost: 0 },
      yearly: { kwh: 0, cost: 0 },
    },
  };
}

describe('money', () => {
  test('formats an INR amount with the rupee sign and Indian grouping', () => {
    expect(money(123456.5, findCurrency('INR')!)).toBe('₹1,23,456.50');
  });
});

describe('number formatting', () => {
  test('pdfNum groups in the Indian system at the requested precision', () => {
    expect(pdfNum(123456.78)).toBe('1,23,456.8');
    expect(pdfNum(700, 0)).toBe('700');
  });

  test('pdfKwh appends the unit', () => {
    expect(pdfKwh(660)).toBe('660.0 kWh');
  });

  test('sumRounded adds the printed rows rather than the raw values', () => {
    // Raw 1.32 rounds to 1.3; the three printed rows (0.4 each) sum to 1.2.
    expect(sumRounded([0.44, 0.44, 0.44])).toBe(1.2);
  });
});

describe('reconciledTotals', () => {
  test('returns each schedule row rounded to paise and their reconciled sum', () => {
    const report = reportWithCosts([4454.13, 3581.41, 1996.05, 381.55]);
    expect(reconciledTotals(report)).toEqual({
      rows: [4454.13, 3581.41, 1996.05, 381.55],
      yearly: 10413.14,
    });
  });

  test('rounds a total that floating-point addition would leave a paisa off', () => {
    const report = reportWithCosts([0.1, 0.2]);
    expect(reconciledTotals(report).yearly).toBe(0.3);
  });
});

describe('buildCategoryLabel', () => {
  test('maps a known build category id to its industry label', () => {
    expect(buildCategoryLabel('gaming')).toBe('Gaming PC');
  });

  test('returns the raw id for an unknown category', () => {
    expect(buildCategoryLabel('quantum')).toBe('quantum');
    // Prototype keys are not build categories.
    expect(buildCategoryLabel('toString')).toBe('toString');
  });

  test('returns an em dash when absent', () => {
    expect(buildCategoryLabel()).toBe('—');
  });
});

describe('deviceCategoryLabel', () => {
  const fanRow: PdfDeviceRow = {
    name: 'Noctua NF-A12x25',
    category: 'fan',
    qty: 2,
    unitW: 2,
    totalW: 4,
    basis: 'estimated',
  };

  test('labels generic case fans as a case fan', () => {
    expect(deviceCategoryLabel({ ...fanRow, name: 'Generic Case fans ×2' })).toBe('Case fan');
  });

  test('falls back to the component category label', () => {
    expect(deviceCategoryLabel(fanRow)).toBe('Fan');
  });
});
