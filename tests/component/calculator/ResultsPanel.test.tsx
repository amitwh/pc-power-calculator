/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { AllSystemsSummary } from '@/components/calculator/AllSystemsSummary';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('ResultsPanel', () => {
  test('renders the three period totals (Daily / Monthly / Yearly)', () => {
    render(<ResultsPanel />);
    expect(screen.getByText(/^Daily$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Monthly$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Yearly$/i)).toBeInTheDocument();
  });

  test('shows kWh for each period', () => {
    render(<ResultsPanel />);
    const allKwh = screen.getAllByText(/kWh/);
    // Daily + Monthly + Yearly → at least three kWh labels.
    expect(allKwh.length).toBeGreaterThanOrEqual(3);
  });

  test('shows the active build name in the heading', () => {
    useBuildStore.getState().renameBuild(useBuildStore.getState().activeBuildId, 'My rig');
    render(<ResultsPanel />);
    expect(screen.getByText(/Results — My rig/i)).toBeInTheDocument();
  });

  test('points to the breakdown cards below', () => {
    render(<ResultsPanel />);
    expect(screen.getByText(/below/i)).toBeInTheDocument();
  });
});

describe('ResultsBreakdown', () => {
  test('renders the power-draw breakdown chart card', () => {
    render(<ResultsBreakdown />);
    expect(screen.getByText(/Power draw breakdown/i)).toBeInTheDocument();
  });

  test('renders the per-workload table card', () => {
    render(<ResultsBreakdown />);
    expect(screen.getByText(/Per-workload usage & performance/i)).toBeInTheDocument();
    // Default schedule has office + browser hours → rows exist.
    expect(screen.getByText(/Office/i)).toBeInTheDocument();
  });
});

describe('AllSystemsSummary', () => {
  test('renders the multi-system summary card', () => {
    render(<AllSystemsSummary />);
    expect(screen.getByText(/All your systems at a glance/i)).toBeInTheDocument();
  });

  test('lists every system in the multi-system summary', () => {
    useBuildStore.getState().addBuild('Workstation');
    useBuildStore.getState().addBuild('Home NAS');
    render(<AllSystemsSummary />);
    expect(screen.getAllByText(/My build/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Workstation/)).toBeInTheDocument();
    expect(screen.getByText(/Home NAS/)).toBeInTheDocument();
  });
});
