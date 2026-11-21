/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Routes from '@/routes';
import { GUIDES } from '@/pages/Guides';
import { getRoutes } from '@/entry-server';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
    </MemoryRouter>,
  );
}

const NEW_SLUGS = ['running-pc-24-7', 'local-ai-power', 'cutting-pc-power'] as const;

describe('/guides hub', () => {
  test('lists every guide on the hub', () => {
    renderAt('/guides');

    // Every guide in the data must be on the hub; the count is asserted as
    // "at least the nine published" so adding an article does not break it.
    expect(GUIDES.length).toBeGreaterThanOrEqual(9);
    for (const guide of GUIDES) {
      expect(screen.getByRole('link', { name: guide.title })).toBeInTheDocument();
    }
    for (const slug of NEW_SLUGS) {
      expect(screen.getByRole('link', { name: GUIDES.find((g) => g.slug === slug)!.title }))
        .toHaveAttribute('href', `/guides/${slug}`);
    }
  });
});

describe('/guides/:slug', () => {
  for (const slug of NEW_SLUGS) {
    test(`${slug} renders its H1`, () => {
      const guide = GUIDES.find((g) => g.slug === slug)!;
      renderAt(`/guides/${slug}`);

      expect(
        screen.getByRole('heading', { level: 1, name: guide.title }),
      ).toBeInTheDocument();
    });
  }
});

describe('prerender manifest', () => {
  test('every GUIDES slug appears in getRoutes()', async () => {
    const routes = await getRoutes();
    const paths = new Set(routes.map((route) => route.path));

    for (const guide of GUIDES) {
      expect(paths.has(`/guides/${guide.slug}`)).toBe(true);
    }
  });
});
