/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Compare from '@/pages/Compare';
import { useBuildStore } from '@/store/buildStore';
import { useStoreHydration } from '@/hooks/useStoreHydration';

/** Mirrors <Layout>, which rehydrates the store after the first render. */
function HydratedCompare() {
  useStoreHydration();
  return <Compare />;
}

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

test('renders Compare on /compare', () => {
  render(
    <MemoryRouter initialEntries={['/compare']}>
      <HydratedCompare />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
});

describe('selected pair is the single source of truth', () => {
  test('a single store build renders the empty state, not a self-comparison', () => {
    expect(useBuildStore.getState().builds).toHaveLength(1);

    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Compare />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Add at least two systems/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to the calculator/i })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/cheaper to run/i)).not.toBeInTheDocument();
  });

  test('three store builds, two selected — exactly two systems and one cheaper badge', () => {
    // Three distinct builds in the store; the selector defaults to the first
    // two. The third must never leak into the comparison.
    useBuildStore.getState().setComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().addBuild('Workstation');
    useBuildStore.getState().setComponent('cpu', 'cpu-intel-i9-14900k');
    useBuildStore.getState().addBuild('Home NAS');

    const stored = useBuildStore.getState().builds;
    expect(stored).toHaveLength(3);

    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Compare />
      </MemoryRouter>,
    );

    expect((screen.getByLabelText('System A') as HTMLSelectElement).value).toBe(stored[0].id);
    expect((screen.getByLabelText('System B') as HTMLSelectElement).value).toBe(stored[1].id);

    // Two system columns, never three — and at most one badge on the page.
    expect(screen.getAllByTestId('compare-system')).toHaveLength(2);
    expect(screen.getAllByText(/cheaper to run/i)).toHaveLength(1);
  });
});

describe('imported-build link (/compare?builds=…)', () => {
  test('imports the build from the exported-HTML link and pre-selects it', async () => {
    // Arrange a JSON payload exactly like buildExportHtml embeds.
    const build = {
      id: 'imported-src',
      name: 'Imported rig',
      category: 'gaming',
      components: { cpu: 'cpu-amd-ryzen-7-7800x3d' },
      tdpOverrides: {},
      quantities: { 'cpu-amd-ryzen-7-7800x3d': 2 },
      schedule: [{ workload_id: 'office', hours_per_day: 8 }],
      location: { country_iso2: 'US' },
    };
    const json = JSON.stringify({ version: 1, build });
    const b64 = btoa(json);
    window.history.replaceState(null, '', `/compare?builds=${encodeURIComponent(b64)}`);

    render(
      <MemoryRouter initialEntries={['/compare']}>
        <HydratedCompare />
      </MemoryRouter>,
    );

    // The import runs after the store is rehydrated, so wait for it.
    await waitFor(() => expect(useBuildStore.getState().builds).toHaveLength(2));
    const store = useBuildStore.getState();
    const imported = store.builds.find((b) => b.name === 'Imported rig');
    expect(imported).toBeDefined();
    expect(imported!.id).not.toBe('imported-src');
    expect(imported!.quantities?.['cpu-amd-ryzen-7-7800x3d']).toBe(2);

    // Slot B is pre-selected with the imported build once it lands.
    await waitFor(() =>
      expect((screen.getByLabelText('System B') as HTMLSelectElement).value).toBe(imported!.id),
    );

    // The query was wiped so a reload can't duplicate the import.
    expect(window.location.search).not.toContain('builds=');
  });

  test('malformed payload is ignored without breaking the page', async () => {
    window.history.replaceState(null, '', '/compare?builds=!!!not-base64!!!');
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <HydratedCompare />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
    await waitFor(() => expect(useBuildStore.getState().builds).toHaveLength(1));
  });
});
