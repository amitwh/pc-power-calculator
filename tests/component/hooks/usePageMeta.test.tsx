/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';

const SITE = 'https://pcpower.concreteinfo.co.in';

/** Applies the hook, plus an optional button for in-app navigation. */
function MetaProbe({ to }: { to?: string }) {
  usePageMeta();
  const navigate = useNavigate();
  return to ? (
    <button type="button" onClick={() => navigate(to)}>
      navigate
    </button>
  ) : null;
}

function renderAt(path: string, navigateTo?: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MetaProbe to={navigateTo} />
    </MemoryRouter>,
  );
}

function canonical(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
}

function robots(): HTMLMetaElement | null {
  return document.querySelector<HTMLMetaElement>('meta[name="robots"]');
}

beforeEach(() => {
  document
    .querySelectorAll('link[rel="canonical"], meta[name="robots"]')
    .forEach((node) => node.remove());
});

describe('usePageMeta', () => {
  test('a known part gets its own title and canonical, with no noindex', () => {
    renderAt('/parts/gpu-amd-rx-6400');

    expect(document.title).toBe('AMD Radeon RX 6400 power consumption & yearly cost');
    expect(canonical()?.href.endsWith('/parts/gpu-amd-rx-6400')).toBe(true);
    expect(robots()).not.toBeInTheDocument();
  });

  test('a trailing slash resolves like the canonical path', () => {
    renderAt('/parts/gpu-amd-rx-6400/');

    expect(document.title).toBe('AMD Radeon RX 6400 power consumption & yearly cost');
    expect(robots()).not.toBeInTheDocument();
  });

  test('an uppercase tariff path still resolves', () => {
    renderAt('/cost/IN');

    expect(document.title).toBe('Electricity cost of running a PC in India');
    expect(robots()).not.toBeInTheDocument();
  });

  test('an unknown part is noindexed and drops the canonical', () => {
    renderAt('/parts/does-not-exist');

    expect(document.title).toBe('Page not found · PC Power Calculator');
    expect(robots()?.content).toContain('noindex');
    expect(canonical()).not.toBeInTheDocument();
  });

  test('an unknown tariff is noindexed', () => {
    renderAt('/cost/zz');

    expect(robots()?.content).toContain('noindex');
    expect(canonical()).not.toBeInTheDocument();
  });

  test('a known tariff is indexable and keeps its canonical', () => {
    renderAt('/cost/in');

    expect(document.title).toBe('Electricity cost of running a PC in India');
    expect(robots()).not.toBeInTheDocument();
    expect(canonical()?.href.endsWith('/cost/in')).toBe(true);
  });

  test('an unknown guide is noindexed', () => {
    renderAt('/guides/not-a-guide');

    expect(robots()?.content).toContain('noindex');
    expect(canonical()).not.toBeInTheDocument();
  });

  test('an unknown static path is noindexed', () => {
    renderAt('/not-a-route');

    expect(robots()?.content).toContain('noindex');
    expect(canonical()).not.toBeInTheDocument();
  });

  test('navigating from a not-found path to home clears the noindex', () => {
    renderAt('/not-a-route', '/');
    expect(robots()?.content).toContain('noindex');

    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    expect(robots()).not.toBeInTheDocument();
    expect(document.title).toBe("PC Power Calculator — estimate your PC's electricity use & cost");
    expect(canonical()?.href).toBe(`${SITE}/`);
  });
});
