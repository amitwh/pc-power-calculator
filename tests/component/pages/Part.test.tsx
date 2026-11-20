/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Routes from '@/routes';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
    </MemoryRouter>,
  );
}

describe('/parts/:id', () => {
  test('renders the part headline and a non-zero cost figure for a known GPU', () => {
    renderAt('/parts/gpu-amd-rx-6400');

    expect(screen.getByRole('heading', { level: 1, name: 'AMD Radeon RX 6400' })).toBeInTheDocument();

    // The cost table shows yearly kWh per scenario; at least one must be > 0.
    const kwhCells = screen.getAllByText(/kWh \/ year/);
    expect(kwhCells.length).toBeGreaterThan(0);
    const nonzero = kwhCells.some((cell) => {
      const value = Number.parseFloat(cell.textContent!.replace(/,/g, ''));
      return Number.isFinite(value) && value > 0;
    });
    expect(nonzero).toBe(true);
  });

  test('lower-power alternatives stay in the same era and power class', () => {
    renderAt('/parts/gpu-amd-rx-6400');

    // 2005-era integrated graphics are lower-power, but not alternatives to a
    // 2022 discrete card — the 6-year / 35% floor must exclude them.
    expect(screen.queryByRole('link', { name: /Intel GMA 900/i })).not.toBeInTheDocument();

    if (screen.queryByText(/Lower-power parts in the same category/i)) {
      expect(screen.getByRole('link', { name: /NVIDIA GeForce GT 1030/i })).toBeInTheDocument();
    }
  });

  test('renders the "Part not found" block for an unknown id', () => {
    renderAt('/parts/does-not-exist');

    expect(screen.getByRole('heading', { name: /Part not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the calculator/i })).toBeInTheDocument();
  });
});
