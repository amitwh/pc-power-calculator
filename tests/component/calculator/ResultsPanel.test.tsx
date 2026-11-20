/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('ResultsPanel Share button', () => {
  afterEach(() => {
    // Restore the missing jsdom clipboard between tests.
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  });

  test('copies a ?builds= permalink and shows the confirmation', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<ResultsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Share build' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('?builds=');
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
  });

  test('shows the export fallback when neither share nor clipboard works', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    render(<ResultsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Share build' }));

    expect(await screen.findByText('Link too long — use Export instead')).toBeInTheDocument();
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
