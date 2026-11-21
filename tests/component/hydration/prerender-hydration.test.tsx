/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { StrictMode } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { hydrateRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { act, cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BuildPicker } from '@/components/calculator/BuildPicker';
import { useStoreHydration } from '@/hooks/useStoreHydration';
import { useBuildStore } from '@/store/buildStore';
import type { Component } from '@/types/component';
import type { BuildConfig } from '@/types/build';

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-/;
const HYDRATION_ERROR_PATTERN = /hydrat|did not match|server rendered/i;

/** Every `id="<prefix>…"` value in a server-rendered HTML string. */
function idsFor(html: string, prefix: string): string[] {
  return Array.from(
    html.matchAll(new RegExp(`id="(${prefix}[^"]*)"`, 'g')),
    (match) => match[1],
  );
}

/** Collect console.error messages that look like a React hydration mismatch. */
function captureHydrationErrors() {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return {
    errors: () =>
      spy.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((message) => HYDRATION_ERROR_PATTERN.test(message)),
    restore: () => spy.mockRestore(),
  };
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

/** Put server HTML in the document, then hydrate it with the same tree. */
async function hydrate(html: string, element: ReactElement): Promise<void> {
  container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  // The real client entry wraps <App /> in StrictMode (src/main.tsx); mirror it
  // so the test fails if StrictMode ever disturbs the server/client useId match.
  await act(async () => {
    root = hydrateRoot(container!, <StrictMode>{element}</StrictMode>);
  });
}

function HydrationHarness() {
  useStoreHydration();
  return <BuildPicker />;
}

/**
 * Mirrors <Layout> (which rehydrates after the first render) around a real
 * page, so page-level mount effects run against the same lifecycle as the app.
 */
function PageHarness({
  useHydration,
  children,
}: {
  useHydration: () => void;
  children: ReactNode;
}) {
  useHydration();
  return <>{children}</>;
}

/**
 * Each regression test needs a store that has never hydrated: zustand's
 * `hasHydrated` flag is module-global and would otherwise stay true from the
 * previous test. Reset the module graph and seed the freshly imported catalog
 * module (the static one seeded in tests/setup.ts is a different instance).
 */
async function loadFreshApp() {
  vi.resetModules();
  const [home, compare, hydration, store, share, data, catalog] = await Promise.all([
    import('@/pages/Home'),
    import('@/pages/Compare'),
    import('@/hooks/useStoreHydration'),
    import('@/store/buildStore'),
    import('@/lib/share/buildLink'),
    import('@/lib/data/components'),
    import('@/data/components.json'),
  ]);
  data.__setCatalogForTests(
    catalog.default as unknown as {
      components: Component[];
      version: string;
      lastUpdated: string;
    },
  );
  return {
    Home: home.default,
    Compare: compare.default,
    useStoreHydration: hydration.useStoreHydration,
    useBuildStore: store.useBuildStore,
    encodeBuildsParam: share.encodeBuildsParam,
    findComponent: data.findComponent,
  };
}

function persistBuilds(builds: BuildConfig[], activeBuildId = builds[0].id): void {
  localStorage.setItem(
    'pc-power-builds',
    JSON.stringify({
      state: { builds, activeBuildId, customPeripherals: [] },
      version: 1,
    }),
  );
}

function importedBuildJson(): string {
  return JSON.stringify({
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
}

function savedBuild(): BuildConfig {
  return {
    id: 'prerender-saved-build',
    name: 'Saved gaming rig',
    category: 'gaming',
    components: {},
    tdpOverrides: {},
    overclock: { cpu_pct: 0, gpu_pct: 0 },
    case_fans: 2,
    schedule: [],
    location: { country_iso2: 'IN' },
  };
}

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

afterEach(async () => {
  if (root) {
    await act(async () => root!.unmount());
    root = null;
  }
  container?.remove();
  container = null;
  cleanup();
});

describe('prerendered hydration', () => {
  test('field ids come from useId — deterministic and never the build UUID', () => {
    const first = renderToString(<BuildPicker />);
    const second = renderToString(<BuildPicker />);

    const firstCpuIds = idsFor(first, 'oc-cpu-');
    const secondCpuIds = idsFor(second, 'oc-cpu-');
    expect(firstCpuIds).toHaveLength(1);
    expect(secondCpuIds).toHaveLength(1);
    expect(firstCpuIds[0]).toBe(secondCpuIds[0]);
    expect(firstCpuIds[0]).not.toMatch(UUID_PATTERN);

    const fanIds = idsFor(first, 'case-fans-');
    expect(fanIds).toHaveLength(1);
    expect(fanIds[0]).not.toMatch(UUID_PATTERN);
  });

  test('hydrating the server-rendered calculator reports no mismatch', async () => {
    const html = renderToString(<BuildPicker />);
    const capture = captureHydrationErrors();
    try {
      await hydrate(html, <BuildPicker />);
      expect(capture.errors()).toEqual([]);
    } finally {
      capture.restore();
    }
  });

  test('saved localStorage state is applied after hydration, with no mismatch', async () => {
    const build = savedBuild();
    localStorage.setItem(
      'pc-power-builds',
      JSON.stringify({
        state: {
          builds: [build],
          activeBuildId: build.id,
          customPeripherals: [],
        },
        version: 1,
      }),
    );

    // The server (and the client's first render) must still see the default
    // build — skipHydration means localStorage is applied only in the effect.
    const html = renderToString(<HydrationHarness />);
    expect(html).not.toContain('Saved gaming rig');

    const capture = captureHydrationErrors();
    try {
      await hydrate(html, <HydrationHarness />);
      await waitFor(() =>
        expect(useBuildStore.getState().builds[0]?.name).toBe('Saved gaming rig'),
      );
      expect(capture.errors()).toEqual([]);
    } finally {
      capture.restore();
    }
  });
});

describe('page mount effects wait for rehydration', () => {
  test('?builds= on / keeps the saved builds and activates the import', async () => {
    const { Home, useStoreHydration, useBuildStore, encodeBuildsParam } = await loadFreshApp();
    const saved = savedBuild();
    persistBuilds([saved]);
    window.history.replaceState(null, '', `/?builds=${encodeBuildsParam(importedBuildJson())}`);

    const element = (
      <PageHarness useHydration={useStoreHydration}>
        <Home />
      </PageHarness>
    );
    const html = renderToString(element);
    expect(html).not.toContain('Saved gaming rig');

    const capture = captureHydrationErrors();
    try {
      await hydrate(html, element);
      await waitFor(() => {
        const state = useBuildStore.getState();
        expect(state.builds.map((b) => b.name).sort()).toEqual(['Saved gaming rig', 'Shared rig']);
        expect(state.builds.find((b) => b.id === state.activeBuildId)?.name).toBe('Shared rig');
      });

      // The clobber showed up in storage first: the saved build must still be
      // there alongside the imported one.
      const persisted = JSON.parse(localStorage.getItem('pc-power-builds')!) as {
        state: { builds: BuildConfig[] };
      };
      expect(persisted.state.builds.map((b) => b.name).sort()).toEqual([
        'Saved gaming rig',
        'Shared rig',
      ]);
      expect(capture.errors()).toEqual([]);
    } finally {
      capture.restore();
    }
  });

  test('?part= on / keeps the saved build and writes the part into it', async () => {
    const { Home, useStoreHydration, useBuildStore, findComponent } = await loadFreshApp();
    expect(findComponent('cpu-amd-ryzen-7-7800x3d')).toBeDefined();
    const saved = savedBuild();
    persistBuilds([saved]);
    window.history.replaceState(null, '', '/?part=cpu-amd-ryzen-7-7800x3d');

    const element = (
      <PageHarness useHydration={useStoreHydration}>
        <Home />
      </PageHarness>
    );
    const html = renderToString(element);
    expect(html).not.toContain('Saved gaming rig');

    const capture = captureHydrationErrors();
    try {
      await hydrate(html, element);
      await waitFor(() => {
        const state = useBuildStore.getState();
        expect(state.builds).toHaveLength(1);
        expect(state.builds[0].id).toBe(saved.id);
        expect(state.builds[0].components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
      });

      const persisted = JSON.parse(localStorage.getItem('pc-power-builds')!) as {
        state: { builds: BuildConfig[] };
      };
      expect(persisted.state.builds).toHaveLength(1);
      expect(persisted.state.builds[0].id).toBe(saved.id);
      expect(persisted.state.builds[0].components.cpu).toBe('cpu-amd-ryzen-7-7800x3d');
      expect(window.location.search).not.toContain('part=');
      expect(capture.errors()).toEqual([]);
    } finally {
      capture.restore();
    }
  });

  test('plain / applies the saved build after hydration', async () => {
    const { Home, useStoreHydration, useBuildStore } = await loadFreshApp();
    const saved = savedBuild();
    persistBuilds([saved]);
    window.history.replaceState(null, '', '/');

    const element = (
      <PageHarness useHydration={useStoreHydration}>
        <Home />
      </PageHarness>
    );
    const html = renderToString(element);
    expect(html).not.toContain('Saved gaming rig');

    const capture = captureHydrationErrors();
    try {
      await hydrate(html, element);
      await waitFor(() => {
        const state = useBuildStore.getState();
        expect(state.builds).toHaveLength(1);
        expect(state.builds[0].name).toBe('Saved gaming rig');
        expect(state.activeBuildId).toBe(saved.id);
      });
      expect(capture.errors()).toEqual([]);
    } finally {
      capture.restore();
    }
  });

  test('/compare reflects the saved builds in the comparison selection', async () => {
    const { Compare, useStoreHydration } = await loadFreshApp();
    const first = { ...savedBuild(), id: 'saved-a', name: 'Saved A' };
    const second = { ...savedBuild(), id: 'saved-b', name: 'Saved B' };
    persistBuilds([first, second], first.id);
    window.history.replaceState(null, '', '/compare');

    const element = (
      <MemoryRouter initialEntries={['/compare']}>
        <PageHarness useHydration={useStoreHydration}>
          <Compare />
        </PageHarness>
      </MemoryRouter>
    );
    const html = renderToString(element);
    expect(html).not.toContain('Saved A');

    const capture = captureHydrationErrors();
    try {
      await hydrate(html, element);
      await waitFor(() => {
        expect((screen.getByLabelText('System A') as HTMLSelectElement).value).toBe('saved-a');
        expect((screen.getByLabelText('System B') as HTMLSelectElement).value).toBe('saved-b');
      });
      expect(capture.errors()).toEqual([]);
    } finally {
      capture.restore();
    }
  });
});
