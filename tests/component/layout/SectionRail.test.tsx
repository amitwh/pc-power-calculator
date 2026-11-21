/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionRail } from '@/components/layout/SectionRail';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('SectionRail', () => {
  test('renders the four section anchors and lists every store build', () => {
    useBuildStore.getState().addBuild('Workstation');
    useBuildStore.getState().addBuild('Home NAS');
    render(<SectionRail />);

    expect(screen.getByText('Sections')).toBeInTheDocument();
    const anchors = screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')]);
    expect(anchors).toEqual([
      ['Your system', '#system'],
      ['Usage', '#usage'],
      ['Tariff', '#tariff'],
      ['Analysis', '#analysis'],
    ]);

    expect(screen.getByText('Systems')).toBeInTheDocument();
    const switches = screen.getAllByRole('button', { name: /^(My build|Workstation|Home NAS)$/ });
    expect(switches.map((b) => b.textContent)).toEqual(['My build', 'Workstation', 'Home NAS']);
  });

  test('switches the active build and adds a new system', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    const firstId = useBuildStore.getState().builds[0].id;
    render(<SectionRail />);

    await user.click(screen.getByRole('button', { name: 'My build' }));
    expect(useBuildStore.getState().activeBuildId).toBe(firstId);
    const active = screen.getByRole('button', { name: 'My build' });
    expect(active).toHaveAttribute('aria-current', 'true');
    // Soft tint + brand left border, not a solid orange fill.
    expect(active).toHaveClass('border-brand', 'bg-brand/5');
    expect(active).not.toHaveClass('bg-brand-dark');

    await user.click(screen.getByRole('button', { name: /\+ New system/i }));
    expect(useBuildStore.getState().builds).toHaveLength(3);
  });

  test('has no delete control when only one build exists', () => {
    render(<SectionRail />);
    expect(screen.queryByRole('button', { name: /^Delete / })).not.toBeInTheDocument();
  });
});

describe('SectionRail — rename and delete', () => {
  test('renaming via the pencil commits on Enter', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<SectionRail />);

    await user.click(screen.getByRole('button', { name: 'Rename Workstation' }));
    const input = screen.getByLabelText('Rename build');
    await user.clear(input);
    await user.type(input, 'Gaming rig{Enter}');

    expect(useBuildStore.getState().builds.map((b) => b.name)).toEqual(['My build', 'Gaming rig']);
    expect(screen.getByRole('button', { name: 'Gaming rig' })).toBeInTheDocument();
  });

  test('double-clicking the row starts inline rename', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<SectionRail />);

    await user.dblClick(screen.getByRole('button', { name: 'Workstation' }));
    expect(screen.getByLabelText('Rename build')).toHaveValue('Workstation');
  });

  test('Escape cancels the rename without touching the store', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<SectionRail />);

    await user.dblClick(screen.getByRole('button', { name: 'Workstation' }));
    const input = screen.getByLabelText('Rename build');
    await user.clear(input);
    await user.type(input, 'Discarded{Escape}');

    expect(useBuildStore.getState().builds.map((b) => b.name)).toEqual(['My build', 'Workstation']);
    expect(screen.getByRole('button', { name: 'Workstation' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Rename build')).not.toBeInTheDocument();
  });

  test('the delete button removes the build and its row', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addBuild('Workstation');
    render(<SectionRail />);

    await user.click(screen.getByRole('button', { name: 'Delete Workstation' }));

    expect(useBuildStore.getState().builds.map((b) => b.name)).toEqual(['My build']);
    expect(screen.queryByRole('button', { name: 'Workstation' })).not.toBeInTheDocument();
  });
});
