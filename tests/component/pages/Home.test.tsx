/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '@/pages/Home';
import { useBuildStore } from '@/store/buildStore';
import { encodeBuildsParam } from '@/lib/share/buildLink';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
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
        <Home />
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
