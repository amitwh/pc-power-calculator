/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import { useBuildStore } from '@/store/buildStore';
import { useStoreHydration } from '@/hooks/useStoreHydration';
import { encodeBuildsParam } from '@/lib/share/buildLink';

/** Mirrors <Layout>, which rehydrates the store after the first render. */
function HydratedHome() {
  useStoreHydration();
  return <Home />;
}

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

describe('Home one-screen structure', () => {
  test('puts the answer beside the inputs with no section rail or anchors', () => {
    // The breakdown cards only render once a part is selected.
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(
      <MemoryRouter initialEntries={['/']}>
        <HydratedHome />
      </MemoryRouter>,
    );

    // The visible page title sits above the grid; Layout owns the route's
    // single h1, so this title is a styled paragraph.
    expect(screen.getByText('What does your PC cost to run?')).toBeInTheDocument();

    // The build switcher and system type are one-line selects in the title row,
    // not a rail.
    expect(screen.getByRole('combobox', { name: 'Active system' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'System type' })).toBeInTheDocument();
    expect(document.querySelector('a[href^="#"]')).toBeNull();

    // Every input card, then the answer, then the breakdown.
    expect(screen.getByRole('heading', { name: /^Your system$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /When you use it/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Your tariff/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Yearly cost/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Where the power goes/i })).toBeInTheDocument();

    // The answer is the page's first section, above every input card.
    const hero = screen.getByRole('heading', { name: /Yearly cost/i });
    const system = screen.getByRole('heading', { name: /^Your system$/i });
    expect(hero.compareDocumentPosition(system) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Home shared-build link', () => {
  test('imports a ?builds= link on mount, activates it and strips the query', async () => {
    const json = JSON.stringify({
      version: 1,
      build: {
        id: 'imported-src',
        name: 'Shared rig',
        category: 'gaming',
        components: { cpu: 'cpu-amd-ryzen-7-7800x3d' },
        tdpOverrides: {},
        quantities: {},
        schedule: [{ workload_id: 'office', hours_per_day: 8 }],
        location: { country_iso2: 'US' },
      },
    });
    window.history.replaceState(null, '', `/?builds=${encodeBuildsParam(json)}`);

    render(
      <MemoryRouter initialEntries={['/']}>
        <HydratedHome />
      </MemoryRouter>,
    );

    await waitFor(() => expect(useBuildStore.getState().builds).toHaveLength(2));
    const imported = useBuildStore.getState().builds.find((b) => b.name === 'Shared rig');
    expect(imported).toBeDefined();
    // importBuild activates the imported build.
    expect(useBuildStore.getState().activeBuildId).toBe(imported!.id);
    // The query is wiped so a reload can't duplicate the import.
    expect(window.location.search).not.toContain('builds=');
  });
});

describe('Home ?part= seeding', () => {
  test('selects the part in its slot and strips the query', async () => {
    window.history.replaceState(null, '', '/?part=cpu-amd-ryzen-7-7800x3d');

    render(
      <MemoryRouter initialEntries={['/']}>
        <HydratedHome />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(useBuildStore.getState().builds[0].components.cpu).toBe('cpu-amd-ryzen-7-7800x3d'),
    );
    expect(window.location.search).not.toContain('part=');
  });

  test('ignores an unknown part id without throwing', () => {
    window.history.replaceState(null, '', '/?part=bogus-part-id');

    expect(() =>
      render(
        <MemoryRouter initialEntries={['/']}>
          <HydratedHome />
        </MemoryRouter>,
      ),
    ).not.toThrow();

    expect(useBuildStore.getState().builds[0].components).toEqual({});
  });
});
