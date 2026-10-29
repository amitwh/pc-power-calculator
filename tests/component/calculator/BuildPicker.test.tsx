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

/** Open the one device picker and pick an option by (partial) name. */
async function pickDevice(user: ReturnType<typeof userEvent.setup>, query: string, name: RegExp) {
  await user.click(screen.getByRole('button', { name: 'Add device' }));
  await user.type(screen.getByRole('searchbox'), query);
  await user.click(screen.getAllByRole('option', { name })[0]);
}

describe('BuildPicker — devices cart', () => {
  test('renders the picker, filter chips, and the default build chip', () => {
    render(<BuildPicker />);
    expect(screen.getByRole('heading', { name: /Your Systems/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add device' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /Filter catalog by category/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /My build/i })).toBeInTheDocument();
    expect(screen.getByText(/No devices yet/i)).toBeInTheDocument();
  });

  test('adding a CPU via the searchable picker lands in the store and the list', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    expect(useBuildStore.getState().builds[0].components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
    expect(screen.getByText(/AMD Ryzen 7 7800X3D/)).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity for AMD Ryzen 7 7800X3D')).toHaveValue(1);
  });

  test('picking the same device again multiplies its units (qty 2)', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    expect(useBuildStore.getState().builds[0].quantities?.['cpu-amd-ryzen-7-7800x3d']).toBe(2);
    expect(screen.getByLabelText('Quantity for AMD Ryzen 7 7800X3D')).toHaveValue(2);
  });

  test('adding RAM twice bumps its quantity instead of blocking the pick', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await pickDevice(user, 'vengeance 32gb ddr5-5600', /Corsair Vengeance 32GB DDR5-5600/);
    await pickDevice(user, 'vengeance 32gb ddr5-5600', /Corsair Vengeance 32GB DDR5-5600/);
    const b = useBuildStore.getState().builds[0];
    expect(b.components.ram).toEqual(['ram-corsair-vengeance-32gb-ddr5-5600']);
    expect(b.quantities?.['ram-corsair-vengeance-32gb-ddr5-5600']).toBe(2);
  });

  test('the + stepper raises the unit count, − lowers it, × removes the row', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addComponent('storage', 'storage-samsung-980-1tb');
    render(<BuildPicker />);
    const name = 'Samsung 980 1TB';
    await user.click(screen.getByRole('button', { name: `Increase quantity for ${name}` }));
    expect(useBuildStore.getState().builds[0].quantities?.['storage-samsung-980-1tb']).toBe(2);
    await user.click(screen.getByRole('button', { name: `Decrease quantity for ${name}` }));
    expect(useBuildStore.getState().builds[0].quantities?.['storage-samsung-980-1tb']).toBeUndefined();
    await user.click(screen.getByRole('button', { name: `Remove ${name}` }));
    expect(useBuildStore.getState().builds[0].components.storage ?? []).not.toContain('storage-samsung-980-1tb');
    expect(screen.getByText(/No devices yet/i)).toBeInTheDocument();
  });

  test('editing the watts field records a TDP override; reset clears it', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addComponent('gpu', 'gpu-nvidia-rtx-4070');
    render(<BuildPicker />);
    const watts = screen.getByLabelText('Rated watts for NVIDIA GeForce RTX 4070');
    await user.clear(watts);
    await user.type(watts, '180');
    await user.tab();
    expect(useBuildStore.getState().builds[0].tdpOverrides['gpu-nvidia-rtx-4070']).toBe(180);
    await user.click(screen.getByRole('button', { name: 'Reset wattage for NVIDIA GeForce RTX 4070' }));
    expect(useBuildStore.getState().builds[0].tdpOverrides['gpu-nvidia-rtx-4070']).toBeUndefined();
  });

  test('custom devices add a peripheral row with the entered wattage', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await user.type(screen.getByLabelText('Custom device name'), 'Desk lamp');
    await user.type(screen.getByLabelText('Custom device wattage'), '9');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    const b = useBuildStore.getState().builds[0];
    const id = b.components.peripherals?.[0];
    expect(id).toBeTruthy();
    const peripheral = useBuildStore.getState().customPeripherals.find((p) => p.id === id);
    expect(peripheral?.tdp_w).toBe(9);
    expect(screen.getByText(/Custom Desk lamp/)).toBeInTheDocument();
  });

  test('category filter chips narrow the option pool', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await user.click(screen.getByRole('button', { name: 'Add device' }));
    await user.type(screen.getByRole('searchbox'), 'ryzen 7');
    const withAll = screen.getAllByRole('option').length;
    expect(withAll).toBeGreaterThan(0);
    // Clicking outside the listbox (the chip) closes it — reopen afterwards.
    await user.click(screen.getByRole('button', { name: 'CPU' }));
    await user.click(screen.getByRole('button', { name: 'Add device' }));
    await user.type(screen.getByRole('searchbox'), 'ryzen 7');
    const withCpu = screen.getAllByRole('option').length;
    expect(withCpu).toBeGreaterThan(0);
    expect(withCpu).toBeLessThanOrEqual(withAll);
    // CPU filter excludes the Ryzen-brand GPUs/boards that 'All' matched.
    const labels = screen.getAllByRole('option').map((o) => o.textContent ?? '');
    expect(labels.every((l) => l.includes('CPU'))).toBe(true);
  });
});

describe('BuildPicker — systems', () => {
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
