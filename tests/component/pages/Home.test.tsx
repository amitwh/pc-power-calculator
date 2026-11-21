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

describe('Home workbench structure', () => {
  test('renders the section rail, four anchored sections and the results rail', () => {
    // The breakdown cards only render once a part is selected.
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(
      <MemoryRouter initialEntries={['/']}>
        <HydratedHome />
      </MemoryRouter>,
    );

    // The visible page title sits above the workbench grid; Layout owns the
    // route's single h1, so this title is a styled paragraph.
    expect(screen.getByText('What does your PC cost to run?')).toBeInTheDocument();

    // Rail anchors target the four work-area cards, with scroll offset.
    const sections = [
      ['Your system', 'system'],
      ['Usage', 'usage'],
      ['Tariff', 'tariff'],
      ['Analysis', 'analysis'],
    ] as const;
    for (const [label, id] of sections) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', `#${id}`);
      expect(document.getElementById(id)).toHaveClass('scroll-mt-6');
    }

    // Every calculator card still renders inside its section.
    expect(screen.getByRole('heading', { name: /^Your Systems/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Usage Schedule/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Location & Tariff/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Yearly cost/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Power draw breakdown/i })).toBeInTheDocument();
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
