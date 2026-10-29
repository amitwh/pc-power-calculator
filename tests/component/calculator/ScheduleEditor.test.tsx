/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText(/of 24 h\/day booked/i)).toBeInTheDocument();
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

describe('ScheduleEditor — 24-hour budget', () => {
  test('header shows booked hours vs free hours', () => {
    render(<ScheduleEditor />);
    // Default schedule: office 8h + browser 4h = 12 h booked, 12 h free.
    expect(screen.getByText(/12\.0 of 24 h\/day booked · 12\.0 h free/)).toBeInTheDocument();
  });

  test('the hours slider cannot push the total past 24 h', () => {
    render(<ScheduleEditor />);
    // Office is at 8 h with 12 h free → slider caps at 20 h.
    const officeSlider = screen.getByLabelText('Hours per day for Office') as HTMLInputElement;
    expect(Number(officeSlider.max)).toBeCloseTo(20, 5);
    expect(Number(officeSlider.min)).toBe(0);
  });

  test('a persisted schedule over 24 h raises an alert and offers no free hours', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 12 },
    ]);
    render(<ScheduleEditor />);
    expect(screen.getByRole('alert')).toHaveTextContent(/totals 28\.0 h in a day/);
    expect(screen.getByText(/28\.0 of 24 h\/day booked/)).toBeInTheDocument();
    // No budget left → sliders cannot go higher than their current value.
    const officeSlider = screen.getByLabelText('Hours per day for Office') as HTMLInputElement;
    expect(Number(officeSlider.max)).toBeCloseTo(16, 5);
  });

  test('adding a workload when no hours remain is blocked with a hint', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 8 },
    ]);
    render(<ScheduleEditor />);
    const addBtn = screen.getByRole('button', { name: /Add workload/i });
    expect(addBtn).toBeDisabled();
    expect(screen.getByText(/24 h fully booked/)).toBeInTheDocument();
  });

  test('a new workload only claims the hours the day still has', () => {
    // 16 + 7 = 23 h booked → only 1 h free, so the default 2 h clamps to 1.
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 7 },
    ]);
    render(<ScheduleEditor />);
    fireEvent.click(screen.getByRole('button', { name: /Add workload/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ Model training/i }));
    const row = useBuildStore.getState().builds[0].schedule.find((s) => s.workload_id === 'training');
    expect(row?.hours_per_day).toBe(1);
  });
});
