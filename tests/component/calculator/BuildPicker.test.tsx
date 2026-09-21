/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('BuildPicker', () => {
  test('renders the default build and slot pickers', () => {
    render(<BuildPicker />);
    expect(screen.getByRole('heading', { name: /Your Systems/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select CPU/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select GPU/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Select Motherboard/i })).toBeInTheDocument();
    // Each build chip exposes a switch button with the build name.
    expect(screen.getByRole('button', { name: /My build/i })).toBeInTheDocument();
  });

  test('shows "Not selected" until a slot is chosen', () => {
    render(<BuildPicker />);
    expect(screen.getAllByText('Not selected')).toHaveLength(3);
  });

  test('selecting a CPU updates the card and store', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    const cpuSelect = screen.getByRole('combobox', { name: /Select CPU/i });
    await user.selectOptions(cpuSelect, 'cpu-amd-ryzen-7-7800x3d');
    const card = screen.getByText('CPU').parentElement!;
    expect(within(card).getByText(/AMD Ryzen 7 7800X3D/i)).toBeInTheDocument();
    expect(within(card).getByText(/120 W/)).toBeInTheDocument();
    expect(useBuildStore.getState().builds[0].components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
  });

  test('add system creates a new build and makes it active', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await user.click(screen.getByRole('button', { name: /\+ Add system/i }));
    // Each chip is a switch button labelled with its build name. The group
    // also contains the "+ Add system" button and remove buttons when more
    // than one build exists, so filter to just the switch buttons.
    const group = screen.getByRole('group', { name: /Build systems/i });
    const switchButtons = within(group).getAllByRole('button', { name: /My build|Build \d+/i });
    expect(switchButtons.length).toBeGreaterThanOrEqual(2);
    expect(useBuildStore.getState().builds).toHaveLength(2);
  });

  test('remove system drops it from the list', async () => {
    const user = userEvent.setup();
    // Replace window.confirm with a no-op auto-accept so the prompt doesn't block the test.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    useBuildStore.getState().addBuild('To remove');
    expect(useBuildStore.getState().builds).toHaveLength(2);
    render(<BuildPicker />);
    const removeBtn = screen.getByRole('button', { name: /Remove To remove/i });
    await user.click(removeBtn);
    expect(useBuildStore.getState().builds.find((b) => b.name === 'To remove')).toBeUndefined();
    confirmSpy.mockRestore();
  });
});
