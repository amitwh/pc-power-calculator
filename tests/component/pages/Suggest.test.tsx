/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Suggest from '@/pages/Suggest';

const ISSUE_URL = 'github.com/amitwh/pc-power-calculator/issues/new';

function renderPage() {
  return render(
    <MemoryRouter>
      <Suggest />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/suggest form', () => {
  test('renders every field and the public-issue note', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: /Suggest a part or correction/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Type$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Subject$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Category$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Rated watts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Details$/i)).toBeInTheDocument();
    expect(screen.getByText(/opens a public GitHub issue/i)).toBeInTheDocument();
  });

  test('a filled form opens a prefilled GitHub issue in a new tab', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    renderPage();

    await user.type(screen.getByLabelText(/^Subject$/i), 'AMD Ryzen 7 7800X3D');
    await user.type(screen.getByLabelText(/Rated watts/i), '120');
    await user.type(screen.getByLabelText(/Source URL/i), 'https://example.com/spec');
    await user.type(
      screen.getByLabelText(/^Details$/i),
      'The listed TDP is the package power, not the wall draw.',
    );
    await user.click(screen.getByRole('button', { name: /Open GitHub issue/i }));

    expect(open).toHaveBeenCalledTimes(1);
    const [url, target, features] = open.mock.calls[0];
    expect(url).toContain(ISSUE_URL);
    expect(target).toBe('_blank');
    expect(features).toBe('noopener,noreferrer');

    const decoded = decodeURIComponent(String(url).replace(/\+/g, ' '));
    expect(decoded).toContain('[Suggestion] Correction to an existing part: AMD Ryzen 7 7800X3D');
    expect(decoded).toContain('**Rated watts:** 120 W');
    expect(decoded).toContain('**Source URL:** https://example.com/spec');
    expect(decoded).toContain('The listed TDP is the package power');

    // The page must not claim the suggestion was submitted.
    expect(screen.getByText(/Opened a prefilled GitHub issue/i)).toBeInTheDocument();
    expect(screen.queryByText(/suggestion (was )?submitted/i)).not.toBeInTheDocument();
  });

  test('missing required fields does not open a window', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue({} as Window);

    renderPage();

    await user.click(screen.getByRole('button', { name: /Open GitHub issue/i }));

    expect(open).not.toHaveBeenCalled();
  });

  test('renders a fallback link when the browser blocks the new tab', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'open').mockReturnValue(null);

    renderPage();

    await user.type(screen.getByLabelText(/^Subject$/i), 'Kerala tariff');
    await user.type(screen.getByLabelText(/^Details$/i), 'Add the 2026 KSEB slabs.');
    await user.click(screen.getByRole('button', { name: /Open GitHub issue/i }));

    const fallback = screen.getByRole('link', { name: /Open the prefilled issue on GitHub/i });
    expect(fallback).toHaveAttribute('href', expect.stringContaining(ISSUE_URL));
    expect(fallback).toHaveAttribute('target', '_blank');
    expect(screen.getByText(/If no tab appeared/i)).toBeInTheDocument();
  });
});
