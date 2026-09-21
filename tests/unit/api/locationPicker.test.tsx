/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationPicker } from '@/components/calculator/LocationPicker';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('LocationPicker manual-rate input', () => {
  test('non-numeric input (e.g. "abc") is rejected — manual_rate_override stays null', async () => {
    const user = userEvent.setup();
    render(<LocationPicker />);
    const input = screen.getByLabelText(/Override ₹\/kWh/i) as HTMLInputElement;
    // Sanity: initial state has no manual override.
    expect(useBuildStore.getState().builds[0].location.manual_rate_override).toBeUndefined();
    // Type a non-numeric string. The browser ignores most non-digit chars for `type=number`,
    // so dispatch a raw change with `abc` to exercise the onChange handler's guard.
    await user.click(input);
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    // The onChange handler in LocationPicker rejects non-finite values → store stays null.
    expect(useBuildStore.getState().builds[0].location.manual_rate_override).toBeUndefined();
  });

  test('empty input clears the override (null)', async () => {
    const user = userEvent.setup();
    render(<LocationPicker />);
    const input = screen.getByLabelText(/Override ₹\/kWh/i) as HTMLInputElement;
    await user.type(input, '8.5');
    expect(useBuildStore.getState().builds[0].location.manual_rate_override).toBe(8.5);
    await user.clear(input);
    expect(useBuildStore.getState().builds[0].location.manual_rate_override).toBeUndefined();
  });

  test('digits above zero set the override', async () => {
    const user = userEvent.setup();
    render(<LocationPicker />);
    const input = screen.getByLabelText(/Override ₹\/kWh/i) as HTMLInputElement;
    await user.type(input, '9.25');
    expect(useBuildStore.getState().builds[0].location.manual_rate_override).toBe(9.25);
  });
});
