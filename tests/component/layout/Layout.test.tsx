/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

test('renders brand link and nav items', () => {
  render(
    <MemoryRouter>
      <Layout>
        <div>child</div>
      </Layout>
    </MemoryRouter>,
  );
  // Brand link is unique; nav labels appear in both TopNav (>=md) and
  // MobileNav (<md). jsdom has no media-query filtering, so both navs render
  // and labels like "Compare" appear twice. Assert presence, not uniqueness.
  expect(screen.getByRole('link', { name: /PC Power Calculator/i })).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /^Calculator$|^Calc$/i }).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /Compare/i }).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /Suggest/i }).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /Data/i }).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /About/i }).length).toBeGreaterThanOrEqual(1);
});
