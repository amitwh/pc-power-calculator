/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Guides from '@/pages/Guides';
import { GUIDE_CATEGORIES, GUIDES } from '@/content/guides';

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/guides']}>
      <Routes>
        <Route path="/guides" element={<Guides />} />
      </Routes>
    </MemoryRouter>,
  );
}

const PSU_GUIDE = 'PSU sizing explained: why we add 35% headroom';
const COMPONENT_GUIDE = 'What each PC component actually draws';

describe('/guides hub', () => {
  test('groups the guides under the category headings', () => {
    renderHub();

    for (const category of GUIDE_CATEGORIES) {
      expect(
        screen.getByRole('heading', { level: 2, name: category.label }),
      ).toBeInTheDocument();
    }
    for (const guide of GUIDES) {
      expect(screen.getByRole('link', { name: guide.title })).toBeInTheDocument();
    }
  });

  test('starts with an empty, labelled search box', () => {
    renderHub();

    const input = screen.getByLabelText(/search guides/i);
    expect(input).toHaveAttribute('type', 'search');
    expect(input).toHaveValue('');
  });

  test('filters the guides live by title', async () => {
    const user = userEvent.setup();
    renderHub();

    await user.type(screen.getByLabelText(/search guides/i), 'psu sizing');

    expect(screen.getByRole('link', { name: PSU_GUIDE })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: COMPONENT_GUIDE })).not.toBeInTheDocument();
  });

  test('filters the guides live by tag', async () => {
    const user = userEvent.setup();
    renderHub();

    await user.type(screen.getByLabelText(/search guides/i), 'undervolting');

    expect(
      screen.getByRole('link', { name: 'Frame caps, undervolting and sleep: what actually cuts your bill' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: PSU_GUIDE })).not.toBeInTheDocument();
  });

  test('says so when the search matches nothing', async () => {
    const user = userEvent.setup();
    renderHub();

    const input = screen.getByLabelText(/search guides/i);
    await user.type(input, 'flux capacitor');

    expect(screen.getByText('No guides match that search.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: PSU_GUIDE })).not.toBeInTheDocument();
  });

  test('restores every guide when the search is cleared', async () => {
    const user = userEvent.setup();
    renderHub();

    const input = screen.getByLabelText(/search guides/i);
    await user.type(input, 'flux capacitor');
    await user.clear(input);

    expect(screen.queryByText('No guides match that search.')).not.toBeInTheDocument();
    for (const guide of GUIDES) {
      expect(screen.getByRole('link', { name: guide.title })).toBeInTheDocument();
    }
  });
});
