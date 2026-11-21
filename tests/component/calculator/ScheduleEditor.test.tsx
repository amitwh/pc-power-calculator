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
    const { container } = render(<ScheduleEditor />);
    expect(screen.getByRole('heading', { name: /^Usage$/i })).toBeInTheDocument();
    expect(screen.getByText(/Office/i)).toBeInTheDocument();
    expect(screen.getByText(/Web browsing/i)).toBeInTheDocument();
    expect(screen.getByText(/h\/day booked/i)).toBeInTheDocument();
    // Sliders are gone — every hour/day input is a stepper.
    expect(container.querySelectorAll('input[type="range"]')).toHaveLength(0);
  });

  test('adds a workload from the picker and it lands in the store', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: /\+ Workload/i }));
    await user.click(screen.getByRole('button', { name: /\+ Model training/i }));
    const schedule = useBuildStore.getState().builds[0].schedule;
    expect(schedule.some((s) => s.workload_id === 'training')).toBe(true);
  });

  test('added workload defaults to 2 h/day, 7 d/wk', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: /\+ Workload/i }));
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
    await user.click(screen.getByRole('button', { name: /\+ Workload/i }));
    // 'Office' is in the default schedule — the picker must not offer it.
    expect(screen.queryByRole('button', { name: /\+ Office/i })).not.toBeInTheDocument();
    // Per-row yearly cost renders for scheduled rows.
    const officeRow = screen.getByText(/Office/i).closest('li')!;
    expect(within(officeRow).getByText(/₹/)).toBeInTheDocument();
  });
});

describe('ScheduleEditor — 24-hour budget', () => {
  test('header shows booked hours vs free hours', () => {
    render(<ScheduleEditor />);
    // Default schedule: office 8h + browser 4h = 12 h booked, 12 h free.
    expect(screen.getByText(/12\.0 h\/day booked · 12\.0 free/)).toBeInTheDocument();
  });

  test('the hour stepper stops at the 24 h budget', async () => {
    const user = userEvent.setup();
    // 19 + 4 = 23 h booked → only 1 h free, so Office caps at 20.
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 19 },
      { workload_id: 'browser', hours_per_day: 4 },
    ]);
    render(<ScheduleEditor />);
    const inc = screen.getByRole('button', { name: 'Increase Office hours' });
    await user.click(inc);
    expect(
      useBuildStore.getState().builds[0].schedule.find((s) => s.workload_id === 'office')?.hours_per_day,
    ).toBe(20);
    expect(inc).toBeDisabled();
  });

  test('a persisted schedule over 24 h raises an alert and offers no free hours', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 12 },
    ]);
    render(<ScheduleEditor />);
    expect(screen.getByRole('alert')).toHaveTextContent(/28\.0 h in a day/);
    expect(screen.getByText(/28\.0 h\/day booked/)).toBeInTheDocument();
    // No budget left → the hour steppers cannot go higher than their value.
    expect(screen.getByRole('button', { name: 'Increase Office hours' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease Office hours' })).toBeEnabled();
  });

  test('adding a workload when no hours remain is blocked with a hint', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 8 },
    ]);
    render(<ScheduleEditor />);
    const addBtn = screen.getByRole('button', { name: /\+ Workload/i });
    expect(addBtn).toBeDisabled();
    expect(screen.getByText(/24 h booked — free some hours first/)).toBeInTheDocument();
  });

  test('a new workload only claims the hours the day still has', () => {
    // 16 + 7 = 23 h booked → only 1 h free, so the default 2 h clamps to 1.
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 7 },
    ]);
    render(<ScheduleEditor />);
    fireEvent.click(screen.getByRole('button', { name: /\+ Workload/i }));
    fireEvent.click(screen.getByRole('button', { name: /\+ Model training/i }));
    const row = useBuildStore.getState().builds[0].schedule.find((s) => s.workload_id === 'training');
    expect(row?.hours_per_day).toBe(1);
  });
});

describe('ScheduleEditor — idle baseline', () => {
  test('the idle stepper updates the build and its readout', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    const idleGroup = screen.getByRole('group', { name: 'idle hours' });
    expect(idleGroup.textContent?.replace(/\s/g, '')).toContain('0h');
    await user.click(screen.getByRole('button', { name: 'Increase idle hours' }));
    expect(useBuildStore.getState().builds[0].idle_hours_per_day).toBe(1);
    expect(idleGroup.textContent?.replace(/\s/g, '')).toContain('1h');
    await user.click(screen.getByRole('button', { name: 'Decrease idle hours' }));
    expect(useBuildStore.getState().builds[0].idle_hours_per_day).toBe(0);
  });

  test('idle hours count against the 24 h budget', () => {
    useBuildStore.getState().setIdleHoursPerDay(4);
    render(<ScheduleEditor />);
    // Default schedule 12 h + 4 h idle = 16 h booked, 8 h free.
    expect(screen.getByText(/16\.0 h\/day booked · 8\.0 free/)).toBeInTheDocument();
    const inc = screen.getByRole('button', { name: 'Increase idle hours' });
    // 4 idle + 8 free → 8 more clicks reach 24 h, then the stepper stops.
    for (let i = 0; i < 8; i++) fireEvent.click(inc);
    expect(useBuildStore.getState().builds[0].idle_hours_per_day).toBe(12);
    expect(inc).toBeDisabled();
  });
});
