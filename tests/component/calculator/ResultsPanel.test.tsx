/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsPanel } from '@/components/calculator/ResultsPanel';
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

  test('renders the power-draw breakdown heading', () => {
    render(<ResultsPanel />);
    expect(screen.getByText(/Power draw breakdown/i)).toBeInTheDocument();
  });

  test('renders the multi-system summary card', () => {
    render(<ResultsPanel />);
    expect(screen.getByText(/All your systems at a glance/i)).toBeInTheDocument();
  });

  test('shows the active build name in the heading', () => {
    useBuildStore.getState().renameBuild(useBuildStore.getState().activeBuildId, 'My rig');
    render(<ResultsPanel />);
    expect(screen.getByText(/Results — My rig/i)).toBeInTheDocument();
  });

  test('lists every system in the multi-system summary', () => {
    const originalId = useBuildStore.getState().activeBuildId;
    useBuildStore.getState().addBuild('Workstation');
    useBuildStore.getState().addBuild('Home NAS');
    // Switch back to the original build so its name appears in the heading AND the
    // summary tile — the other builds still appear only in the summary tile.
    useBuildStore.getState().setActiveBuild(originalId);
    render(<ResultsPanel />);
    // Use getAllByText because some names also appear in the CardTitle heading.
    expect(screen.getAllByText(/My build/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Workstation/)).toBeInTheDocument();
    expect(screen.getByText(/Home NAS/)).toBeInTheDocument();
  });
});
