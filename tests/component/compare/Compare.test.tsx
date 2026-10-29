/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Compare from '@/pages/Compare';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

test('renders Compare on /compare', () => {
  render(
    <MemoryRouter initialEntries={['/compare']}>
      <Compare />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
});

describe('imported-build link (#/compare?builds=…)', () => {
  test('imports the build from the exported-HTML link and pre-selects it', () => {
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
    window.history.replaceState(null, '', `#/compare?builds=${encodeURIComponent(b64)}`);

    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Compare />
      </MemoryRouter>,
    );

    // The build landed in the store with a fresh id.
    const store = useBuildStore.getState();
    expect(store.builds).toHaveLength(2);
    const imported = store.builds.find((b) => b.name === 'Imported rig');
    expect(imported).toBeDefined();
    expect(imported!.id).not.toBe('imported-src');
    expect(imported!.quantities?.['cpu-amd-ryzen-7-7800x3d']).toBe(2);

    // Slot B is pre-selected with the imported build.
    const selectorB = screen.getByLabelText('System B') as HTMLSelectElement;
    expect(selectorB.value).toBe(imported!.id);

    // The query was wiped so a reload can't duplicate the import.
    expect(window.location.hash).not.toContain('builds=');
  });

  test('malformed payload is ignored without breaking the page', () => {
    window.history.replaceState(null, '', '#/compare?builds=!!!not-base64!!!');
    render(
      <MemoryRouter initialEntries={['/compare']}>
        <Compare />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
    expect(useBuildStore.getState().builds).toHaveLength(1);
  });
});
