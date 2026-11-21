/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { GUIDES } from '@/content/guides';

const SITE = 'https://pcpower.concreteinfo.co.in';
const OG_IMAGE = `${SITE}/og.png`;

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

/** The content of a meta tag, matched by name or property. */
function metaContent(selector: string): string | undefined {
  return document.querySelector<HTMLMetaElement>(selector)?.content;
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

  test('a known page carries its description, keywords and social tags', () => {
    renderAt('/compare');

    expect(metaContent('meta[name="description"]')).toBe(
      'Compare PC builds side by side: yearly kWh, running cost in your currency, PSU sizing and a verdict on which system is cheaper to run.',
    );
    expect(metaContent('meta[name="keywords"]')).toContain('compare pc power consumption');
    expect(metaContent('meta[property="og:title"]')).toBe('Compare systems · PC Power Calculator');
    expect(metaContent('meta[property="og:description"]')).toBe(
      metaContent('meta[name="description"]'),
    );
    expect(metaContent('meta[property="og:url"]')).toBe(`${SITE}/compare`);
    expect(metaContent('meta[property="og:type"]')).toBe('website');
    expect(metaContent('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(metaContent('meta[name="twitter:title"]')).toBe('Compare systems · PC Power Calculator');
    expect(metaContent('meta[name="twitter:description"]')).toBe(
      metaContent('meta[name="description"]'),
    );
    expect(metaContent('meta[name="twitter:image"]')).toBe(OG_IMAGE);
  });

  test('a client-side navigation refreshes the description, keywords and social tags', () => {
    renderAt('/', '/compare');

    const homeDescription = metaContent('meta[name="description"]');
    expect(homeDescription).toContain("Estimate your PC's power draw");
    expect(metaContent('meta[property="og:title"]')).toBe(
      "PC Power Calculator — estimate your PC's electricity use & cost",
    );

    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    // Every tag has to follow the route — the old page's description and OG
    // tags used to survive the navigation.
    expect(metaContent('meta[name="description"]')).not.toBe(homeDescription);
    expect(metaContent('meta[name="description"]')).toContain('Compare PC builds side by side');
    expect(metaContent('meta[name="keywords"]')).toContain('compare pc power consumption');
    expect(metaContent('meta[property="og:title"]')).toBe('Compare systems · PC Power Calculator');
    expect(metaContent('meta[property="og:description"]')).toBe(
      metaContent('meta[name="description"]'),
    );
    expect(metaContent('meta[property="og:url"]')).toBe(`${SITE}/compare`);
    expect(metaContent('meta[name="twitter:title"]')).toBe('Compare systems · PC Power Calculator');
    expect(metaContent('meta[name="twitter:description"]')).toBe(
      metaContent('meta[name="description"]'),
    );
  });

  test('a guide page is an article, and the tags are not duplicated', () => {
    const guide = GUIDES[0];
    renderAt(`/guides/${guide.slug}`);

    expect(metaContent('meta[property="og:type"]')).toBe('article');
    expect(metaContent('meta[name="keywords"]')).toContain('pc power calculator');
    expect(document.querySelectorAll('meta[name="keywords"]')).toHaveLength(1);
    expect(document.querySelectorAll('meta[property="og:title"]')).toHaveLength(1);
    expect(document.querySelectorAll('meta[name="twitter:card"]')).toHaveLength(1);
  });

  test('an unknown path still gets a description and drops the canonical', () => {
    renderAt('/not-a-route');

    expect(metaContent('meta[name="description"]')?.trim()).toBeTruthy();
    expect(robots()?.content).toContain('noindex');
    expect(canonical()).not.toBeInTheDocument();
  });
});
