import { findCurrency } from '@/lib/data/currencies';
import type { PdfReport } from '@/lib/export/report';

const inr = findCurrency('INR')!;

/**
 * The emptiest report the export can be handed: no components, no schedule and
 * a PSU that is entirely unknown. It must still produce a readable document.
 */
export const emptyReport: PdfReport = {
  buildName: 'Empty build',
  locationLabel: 'Maharashtra, India',
  tariffLabel: 'No tariff selected',
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
  schedule: [],
  totals: {
    daily: { kwh: 0, cost: 0 },
    monthly: { kwh: 0, cost: 0 },
    yearly: { kwh: 0, cost: 0 },
  },
};

/**
 * A representative gaming build whose figures reconcile: the device rows add up
 * to the stated typical draw, and the schedule costs add up to the yearly total.
 */
export const gamingReport: PdfReport = {
  buildName: 'Gaming build',
  buildCategory: 'gaming',
  locationLabel: 'Maharashtra, India',
  tariffLabel: 'Maharashtra DISCOM slab tariff',
  currency: inr,
  devices: [
    {
      name: 'AMD Ryzen 7 7800X3D',
      category: 'cpu',
      qty: 1,
      unitW: 120,
      totalW: 120,
      basis: 'rated',
      source: 'amd.com',
    },
    {
      name: 'NVIDIA GeForce RTX 4070',
      category: 'gpu',
      qty: 1,
      unitW: 263,
      totalW: 263,
      basis: 'rated',
      source: 'nvidia.com',
    },
    {
      name: 'Corsair Vengeance DDR5 16 GB',
      category: 'ram',
      qty: 2,
      unitW: 5,
      totalW: 10,
      basis: 'estimated',
    },
    {
      name: 'Samsung 990 Pro 1 TB',
      category: 'storage',
      qty: 1,
      unitW: 8,
      totalW: 8,
      basis: 'estimated',
    },
    {
      name: 'MSI B650 Tomahawk',
      category: 'motherboard',
      qty: 1,
      unitW: 8,
      totalW: 8,
      basis: 'rated',
    },
    {
      name: 'Dell UltraSharp 27',
      category: 'monitor',
      qty: 1,
      unitW: 60,
      totalW: 60,
      basis: 'estimated',
    },
    {
      name: 'Generic Case fans ×2',
      category: 'peripheral',
      qty: 2,
      unitW: 2,
      totalW: 4,
      basis: 'estimated',
    },
  ],
  typicalComponentW: 473,
  idleWallW: 74.6,
  psu: {
    name: 'System Power 10 650W',
    ratedW: 650,
    certification: '80 PLUS Bronze',
    efficiencyAtLoad: 0.87,
    recommendedW: 600,
    peakComponentW: 473,
    peakWallW: 530.1,
  },
  schedule: [
    {
      name: 'Gaming (1080p)',
      hoursPerDay: 4,
      daysPerWeek: 7,
      drawW: 437,
      kwhYear: 635.9,
      costYear: 4454.13,
    },
    {
      name: 'Office',
      hoursPerDay: 8,
      daysPerWeek: 7,
      drawW: 176,
      kwhYear: 511.3,
      costYear: 3581.41,
    },
    {
      name: 'Web browsing',
      hoursPerDay: 4,
      daysPerWeek: 7,
      drawW: 196,
      kwhYear: 285.0,
      costYear: 1996.05,
    },
    {
      name: 'Idle / desktop',
      hoursPerDay: 2,
      daysPerWeek: 7,
      drawW: 75,
      kwhYear: 54.5,
      costYear: 381.55,
    },
  ],
  totals: {
    daily: { kwh: 4.07, cost: 28.51 },
    monthly: { kwh: 123.88, cost: 867.87 },
    yearly: { kwh: 1486.6, cost: 10413.14 },
  },
  measured: { idle_w: 90, load_w: 520, avg_w: 130 },
  tariffSource: 'DISCOM tariff orders, state-wise (see country note)',
  tariffVerifiedAt: '2026-10-29',
  catalogVerifiedAt: '2026-09-21',
};

/**
 * A build whose schedule rows add up to ₹1,23,456.50 — a lakh-scale figure
 * with paise and Indian digit grouping, used to prove the rupee glyph survives
 * the font subsetting.
 */
export const lakhReport: PdfReport = {
  ...gamingReport,
  buildName: 'Lakh build',
  schedule: [
    {
      name: 'Gaming (1080p)',
      hoursPerDay: 4,
      daysPerWeek: 7,
      drawW: 437,
      kwhYear: 635.9,
      costYear: 100000,
    },
    {
      name: 'Office',
      hoursPerDay: 8,
      daysPerWeek: 7,
      drawW: 176,
      kwhYear: 511.3,
      costYear: 20000,
    },
    {
      name: 'Web browsing',
      hoursPerDay: 4,
      daysPerWeek: 7,
      drawW: 196,
      kwhYear: 285.0,
      costYear: 3000,
    },
    {
      name: 'Idle / desktop',
      hoursPerDay: 2,
      daysPerWeek: 7,
      drawW: 75,
      kwhYear: 54.5,
      costYear: 456.5,
    },
  ],
  totals: {
    daily: { kwh: 4.07, cost: 338.24 },
    monthly: { kwh: 123.88, cost: 10288.04 },
    yearly: { kwh: 1486.6, cost: 123456.5 },
  },
};
