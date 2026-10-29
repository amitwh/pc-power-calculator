/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('ScheduleEditor', () => {
  test('renders the default schedule rows with names and totals', () => {
    render(<ScheduleEditor />);
    expect(screen.getByRole('heading', { name: /Usage schedule/i })).toBeInTheDocument();
    expect(screen.getByText(/Office/i)).toBeInTheDocument();
    expect(screen.getByText(/Web browsing/i)).toBeInTheDocument();
    expect(screen.getByText(/Total:/i)).toBeInTheDocument();
  });

  test('adds a workload from the picker and it lands in the store', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: /Add workload/i }));
    await user.click(screen.getByRole('button', { name: /\+ Model training/i }));
    const schedule = useBuildStore.getState().builds[0].schedule;
    expect(schedule.some((s) => s.workload_id === 'training')).toBe(true);
  });

  test('added workload defaults to 2 h/day, 7 d/wk', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: /Add workload/i }));
    await user.click(screen.getByRole('button', { name: /\+ Blender rendering/i }));
    const row = useBuildStore.getState().builds[0].schedule.find((s) => s.workload_id === 'render_blender');
    expect(row?.hours_per_day).toBe(2);
    expect(row?.days_per_week).toBe(7);
  });

  test('removes a workload via its × button', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: /Remove Web browsing/i }));
    const schedule = useBuildStore.getState().builds[0].schedule;
    expect(schedule.some((s) => s.workload_id === 'browser')).toBe(false);
    expect(schedule.some((s) => s.workload_id === 'office')).toBe(true);
  });

  test('already-scheduled workloads do not reappear in the picker', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: /Add workload/i }));
    // 'Office' is in the default schedule — the picker must not offer it.
    expect(screen.queryByRole('button', { name: /\+ Office/i })).not.toBeInTheDocument();
    // Per-row yearly impact renders for scheduled rows.
    const officeRow = screen.getByText(/Office/i).closest('div')!;
    expect(within(officeRow.parentElement as HTMLElement).getByText(/≈/)).toBeInTheDocument();
  });
});
