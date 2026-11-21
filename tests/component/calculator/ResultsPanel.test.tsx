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
  test('leads with the yearly answer and keeps month/day as one compact row', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsPanel />);
    expect(screen.getByRole('heading', { name: /Yearly cost/i })).toBeInTheDocument();
    expect(screen.getByText(/^Monthly$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Daily$/i)).toBeInTheDocument();
  });

  test('shows yearly kWh with the effective per-kWh rate', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsPanel />);
    expect(screen.getByText(/^[\d,.]+\s*kWh$/)).toBeInTheDocument();
    expect(screen.getByText(/₹\d+\.\d{2}\/kWh/)).toBeInTheDocument();
  });

  test('prompts instead of estimating when no parts are added', () => {
    render(<ResultsPanel />);
    expect(screen.getByText(/Add a part and the yearly running cost appears here/i)).toBeInTheDocument();
    // No figure derived from the case-fan aggregate, and nothing to export.
    expect(screen.queryByText(/\/kWh/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share build/i })).not.toBeInTheDocument();
  });

  test('does not use the build name as the results title', () => {
    useBuildStore.getState().renameBuild(useBuildStore.getState().activeBuildId, 'My rig');
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsPanel />);
    expect(screen.getByRole('heading', { name: /Yearly cost/i })).toBeInTheDocument();
    expect(screen.queryByText(/Results — My rig/i)).not.toBeInTheDocument();
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
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Share build' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain('?builds=');
    expect(await screen.findByText('Link copied')).toBeInTheDocument();
  });

  test('shows the export fallback when neither share nor clipboard works', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Share build' }));

    expect(await screen.findByText('Link too long — use Export instead')).toBeInTheDocument();
  });
});

describe('ResultsBreakdown', () => {
  test('renders the power-draw breakdown chart card once a part is selected', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsBreakdown />);
    expect(screen.getByText(/Power draw breakdown/i)).toBeInTheDocument();
  });

  test('renders the per-workload table card once a part is selected', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsBreakdown />);
    expect(screen.getByText(/Per-workload usage/i)).toBeInTheDocument();
    // Default schedule has office + browser hours → rows exist.
    expect(screen.getByText(/Office/i)).toBeInTheDocument();
  });

  test('renders nothing at all when there are no parts', () => {
    // ResultsPanel already carries the single prompt; a second empty card
    // below the fold read as a broken page rather than an empty one.
    const { container } = render(<ResultsBreakdown />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('AllSystemsSummary', () => {
  test('renders nothing with a single build', () => {
    const { container } = render(<AllSystemsSummary />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders the multi-system summary card once there are two builds', () => {
    useBuildStore.getState().addBuild('Workstation');
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
