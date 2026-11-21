/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsBreakdown } from '@/components/calculator/ResultsBreakdown';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('ResultsBreakdown', () => {
  test('renders nothing at all when there are no parts', () => {
    // The hero already carries the one prompt; a second empty card below the
    // fold read as a broken page rather than an empty one.
    const { container } = render(<ResultsBreakdown />);
    expect(container).toBeEmptyDOMElement();
  });

  test('shows the draw donut and a yearly cost table once a part exists', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<ResultsBreakdown />);

    expect(screen.getByRole('heading', { name: /Where the power goes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Cost by use case/i })).toBeInTheDocument();

    // Yearly figures, not a day's worth: the office row alone is >100 kWh/yr.
    const officeRow = screen.getByText('Office').closest('tr')!;
    const kwh = officeRow.querySelectorAll('td')[2].textContent ?? '';
    expect(Number(kwh.replace(/[^\d.]/g, ''))).toBeGreaterThan(100);
    expect(officeRow.textContent).toMatch(/₹/);
  });

  test('lists the idle baseline alongside the use cases', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().setIdleHoursPerDay(10);
    render(<ResultsBreakdown />);
    expect(screen.getByRole('row', { name: /Idle/i })).toBeInTheDocument();
  });
});
