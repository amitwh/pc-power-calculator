/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@/components/layout/Layout';

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout>
        <div>child</div>
      </Layout>
    </MemoryRouter>,
  );
}

test('renders the brand and the four first-level nav items', () => {
  renderLayout();
  // The wordmark appears in both MobileHeader (<md) and TopNav (>=md); jsdom
  // has no media-query filtering, so both render. Assert presence.
  expect(screen.getAllByRole('link', { name: /PC Power Calculator/i }).length)
    .toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /^Calculator$|^Calc$/i }).length)
    .toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /^Compare$/i }).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /^Guides$/i }).length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByRole('link', { name: /^About$/i }).length).toBeGreaterThanOrEqual(1);
});

test('secondary destinations and the disclaimer live in the footer', () => {
  renderLayout();

  expect(screen.getByRole('link', { name: /^Suggest a part$/i })).toHaveAttribute(
    'href',
    '/suggest',
  );
  expect(screen.getByRole('link', { name: /^Data freshness$/i })).toHaveAttribute('href', '/data');
  expect(screen.getByRole('link', { name: /^Privacy$/i })).toHaveAttribute('href', '/privacy');
  // "About" is also in both navs; the footer link is the third one.
  expect(
    screen.getAllByRole('link', { name: /^About$/i }).some((l) => l.getAttribute('href') === '/about'),
  ).toBe(true);

  expect(
    screen.getByText(/Figures are estimates for information only/i),
  ).toBeInTheDocument();
});
