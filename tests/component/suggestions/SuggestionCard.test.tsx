/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuggestionCard } from '@/components/suggestions/SuggestionCard';
import type { Suggestion } from '@/lib/calc/suggest';

const suggestion: Suggestion = {
  component_id: 'cpu-amd-ryzen-9-7950x',
  category: 'cpu',
  current: { tdp_w: 170, perf_score: 200 },
  alternative: {
    id: 'cpu-amd-ryzen-7-7800x3d',
    category: 'cpu',
    brand: 'AMD',
    model: 'Ryzen 7 7800X3D',
    releaseYear: 2023,
    tdp_w: 120,
    specs: {},
    source: 'amd.com',
    addedAt: '2026-09-21',
  },
  alt: { tdp_w: 120, perf_score: 225 },
  impact: {
    kwh_saved_per_year: 146,
    cost_saved_per_year: 1095,
    perf_retention_pct: 112.5,
  },
};

describe('SuggestionCard', () => {
  test('shows category, brand/model, and savings for the alternative', () => {
    render(<SuggestionCard s={suggestion} onApply={vi.fn()} />);
    expect(screen.getByText(/^cpu$/i)).toBeInTheDocument();
    expect(screen.getByText(/AMD Ryzen 7 7800X3D/)).toBeInTheDocument();
    expect(screen.getByText(/120 W/)).toBeInTheDocument();
    expect(screen.getByText(/113% perf retained/i)).toBeInTheDocument();
  });

  test('renders Apply button', () => {
    render(<SuggestionCard s={suggestion} onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: /apply/i })).toBeInTheDocument();
  });

  test('invokes onApply with alternative id and slot when Apply is clicked', async () => {
    const onApply = vi.fn();
    render(<SuggestionCard s={suggestion} onApply={onApply} />);
    await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith('cpu-amd-ryzen-7-7800x3d', 'cpu');
  });

  test('shows kWh and INR savings with the success color', () => {
    render(<SuggestionCard s={suggestion} onApply={vi.fn()} />);
    expect(screen.getByText(/146 kWh\/yr/i)).toBeInTheDocument();
    expect(screen.getByText(/₹1,095/i)).toBeInTheDocument();
  });
});