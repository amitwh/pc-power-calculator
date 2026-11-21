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
  await user.click(screen.getByRole('button', { name: /add a part/i }));
  await user.type(screen.getByRole('searchbox'), query);
  await user.click(screen.getAllByRole('option', { name })[0]);
}

describe('BuildPicker — devices cart', () => {
  test('renders the compact system controls and the one device picker', () => {
    render(<BuildPicker />);
    expect(screen.getByRole('heading', { name: /^Your system$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add a part/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Filter parts by category')).toBeInTheDocument();
    // Build switching and system type live in the one-line BuildBar above the
    // grid — the picker card carries no duplicate system chips or use-case select.
    expect(screen.queryByLabelText('Use case')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /My build/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add your first part/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /Build systems/i })).not.toBeInTheDocument();
  });

  test('hides the device counter at zero and shows it once a part is added', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    expect(screen.queryByText('0 part')).not.toBeInTheDocument();

    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    expect(screen.getByText('1 part')).toBeInTheDocument();
  });

  test('adding a CPU via the searchable picker lands in the store and the list', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    expect(useBuildStore.getState().builds[0].components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
    expect(screen.getByText(/AMD Ryzen 7 7800X3D/)).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Quantity for AMD Ryzen 7 7800X3D' })).getByText('1')).toBeInTheDocument();
  });

  test('picking the same device again multiplies its units (qty 2)', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    await pickDevice(user, '7800x3d', /Ryzen 7 7800X3D/);
    expect(useBuildStore.getState().builds[0].quantities?.['cpu-amd-ryzen-7-7800x3d']).toBe(2);
    expect(within(screen.getByRole('group', { name: 'Quantity for AMD Ryzen 7 7800X3D' })).getByText('2')).toBeInTheDocument();
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
    expect(screen.queryByText(/Samsung 980 1TB/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add a part/i })).toBeInTheDocument();
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
    // The custom-device form now lives inside the collapsed Advanced group.
    await user.click(screen.getByText(/^Advanced$/));
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

  test('the category filter select narrows the option pool', async () => {
    const user = userEvent.setup();
    render(<BuildPicker />);
    await user.selectOptions(screen.getByLabelText('Filter parts by category'), 'cpu');
    await user.click(screen.getByRole('button', { name: /add a part/i }));
    await user.type(screen.getByRole('searchbox'), 'ryzen 7');
    // Scope to the listbox — the native selects' own <option> children also
    // expose the `option` role.
    const options = within(screen.getByRole('listbox')).getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    // CPU filter excludes the Ryzen-brand GPUs/boards that 'All' would match.
    const labels = options.map((o) => o.textContent ?? '');
    expect(labels.every((l) => l.includes('CPU'))).toBe(true);
  });
});
