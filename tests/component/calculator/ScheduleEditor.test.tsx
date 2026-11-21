/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ScheduleEditor } from '@/components/calculator/ScheduleEditor';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

const hours = () => useBuildStore.getState().builds[0].schedule;

describe('ScheduleEditor', () => {
  test('renders one slider row per scheduled use case plus the idle baseline', () => {
    render(<ScheduleEditor />);
    expect(screen.getByRole('heading', { name: /When you use it/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Office hours per day')).toHaveAttribute('type', 'range');
    expect(screen.getByLabelText('Web browsing hours per day')).toBeInTheDocument();
    expect(screen.getByLabelText('Idle hours per day')).toBeInTheDocument();
  });

  test('moving a slider writes hours_per_day to the store', () => {
    render(<ScheduleEditor />);
    fireEvent.change(screen.getByLabelText('Office hours per day'), { target: { value: '5' } });
    expect(hours().find((s) => s.workload_id === 'office')?.hours_per_day).toBe(5);
  });

  test('a slider cannot push the day past 24 hours', () => {
    render(<ScheduleEditor />);
    // 12 h booked, so the office slider tops out at 8 + 12 = 20.
    const office = screen.getByLabelText('Office hours per day');
    expect(office).toHaveAttribute('max', '20');
    fireEvent.change(office, { target: { value: '20' } });
    expect(hours().find((s) => s.workload_id === 'office')?.hours_per_day).toBe(20);
    expect(screen.getByText(/of 24 h/)).toHaveTextContent('24 of 24 h');
  });

  test('the header counts booked hours', () => {
    render(<ScheduleEditor />);
    expect(screen.getByText(/of 24 h/)).toHaveTextContent('12 of 24 h');
  });

  test('a schedule over 24 h is flagged', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 12 },
    ]);
    render(<ScheduleEditor />);
    expect(screen.getByRole('alert')).toHaveTextContent(/28.0 h in a day/);
  });

  test('removing a use case drops it from the store', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.click(screen.getByRole('button', { name: 'Remove Web browsing' }));
    expect(hours().some((s) => s.workload_id === 'browser')).toBe(false);
  });
});

describe('ScheduleEditor — use case dropdown', () => {
  test('swapping a use case on a row keeps the hours', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    await user.selectOptions(screen.getByLabelText('Use case (Office)'), 'compile');
    const row = hours().find((s) => s.workload_id === 'compile');
    expect(row?.hours_per_day).toBe(8);
    expect(hours().some((s) => s.workload_id === 'office')).toBe(false);
  });

  test('choosing a use case that is already scheduled swaps the two rows', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    // Office (8 h) → Web browsing, which is already there at 4 h.
    await user.selectOptions(screen.getByLabelText('Use case (Office)'), 'browser');
    const browser = hours().find((s) => s.workload_id === 'browser');
    const office = hours().find((s) => s.workload_id === 'office');
    expect(browser?.hours_per_day).toBe(8);
    expect(office?.hours_per_day).toBe(4);
    // Still three rows (the default schedule also carries Gaming) — no duplicate.
    expect(hours()).toHaveLength(3);
  });

  test('the add dropdown offers only unscheduled use cases and adds one', async () => {
    const user = userEvent.setup();
    render(<ScheduleEditor />);
    const add = screen.getByLabelText('Add a use case');
    const offered = within(add).getAllByRole('option').map((o) => o.textContent);
    expect(offered).not.toContain('Office');
    expect(offered).toContain('Blender rendering');

    await user.selectOptions(add, 'render_blender');
    const added = hours().find((s) => s.workload_id === 'render_blender');
    expect(added?.hours_per_day).toBe(2);
    expect(added?.days_per_week).toBe(7);
  });

  test('the add dropdown shrinks what a new case can claim to the free hours', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 7 },
    ]);
    render(<ScheduleEditor />);
    fireEvent.change(screen.getByLabelText('Add a use case'), { target: { value: 'training' } });
    expect(hours().find((s) => s.workload_id === 'training')?.hours_per_day).toBe(1);
  });

  test('a fully booked day disables the add dropdown', () => {
    useBuildStore.getState().setSchedule([
      { workload_id: 'office', hours_per_day: 16 },
      { workload_id: 'browser', hours_per_day: 8 },
    ]);
    render(<ScheduleEditor />);
    const add = screen.getByLabelText('Add a use case');
    expect(add).toBeDisabled();
    expect(screen.getByText(/24 h booked/)).toBeInTheDocument();
  });
});

describe('ScheduleEditor — idle baseline', () => {
  test('the idle slider updates the build and counts against the budget', () => {
    render(<ScheduleEditor />);
    const idle = screen.getByLabelText('Idle hours per day');
    expect(idle).toHaveAttribute('max', '12');
    fireEvent.change(idle, { target: { value: '4' } });
    expect(useBuildStore.getState().builds[0].idle_hours_per_day).toBe(4);
    expect(screen.getByText(/of 24 h/)).toHaveTextContent('16 of 24 h');
  });
});
