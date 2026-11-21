/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BuildBar } from '@/components/layout/BuildBar';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('BuildBar', () => {
  test('lists every build in one select and keeps the active one selected', () => {
    useBuildStore.getState().addBuild('Workstation');
    useBuildStore.getState().addBuild('Home NAS');
    render(<BuildBar />);

    const select = screen.getByRole('combobox', { name: 'Active system' });
    expect(Array.from(select.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      'My build',
      'Workstation',
      'Home NAS',
    ]);
    expect(select).toHaveValue(useBuildStore.getState().activeBuildId);
  });

  test('switching the select changes the active build', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    const first = useBuildStore.getState().builds[0];
    render(<BuildBar />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Active system' }), first.id);
    expect(useBuildStore.getState().activeBuildId).toBe(first.id);
  });

  test('adds a new system', async () => {
    const user = userEvent.setup();
    render(<BuildBar />);
    await user.click(screen.getByRole('button', { name: '+ System' }));
    expect(useBuildStore.getState().builds).toHaveLength(2);
  });

  test('has no delete control when only one build exists', () => {
    render(<BuildBar />);
    expect(screen.queryByRole('button', { name: 'Delete system' })).not.toBeInTheDocument();
  });
});

describe('BuildBar — rename and delete', () => {
  test('renaming the active build commits on Enter', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<BuildBar />);

    await user.click(screen.getByRole('button', { name: 'Rename system' }));
    const input = screen.getByLabelText('Rename build');
    await user.clear(input);
    await user.type(input, 'Gaming rig{Enter}');

    expect(useBuildStore.getState().builds.map((b) => b.name)).toEqual(['My build', 'Gaming rig']);
    expect(screen.getByRole('combobox', { name: 'Active system' })).toBeInTheDocument();
  });

  test('Escape cancels the rename without touching the store', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<BuildBar />);

    await user.click(screen.getByRole('button', { name: 'Rename system' }));
    const input = screen.getByLabelText('Rename build');
    await user.clear(input);
    await user.type(input, 'Discarded{Escape}');

    expect(useBuildStore.getState().builds.map((b) => b.name)).toEqual(['My build', 'Workstation']);
    expect(screen.queryByLabelText('Rename build')).not.toBeInTheDocument();
  });

  test('deleting the active build removes it from the select', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<BuildBar />);

    await user.click(screen.getByRole('button', { name: 'Delete system' }));

    // addBuild activates the new system, so the delete removes 'Workstation'.
    expect(useBuildStore.getState().builds.map((b) => b.name)).toEqual(['My build']);
    expect(screen.getByRole('combobox', { name: 'Active system' })).toHaveValue(
      useBuildStore.getState().activeBuildId,
    );
  });
});
