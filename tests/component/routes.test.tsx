/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Routes from '@/routes';

test('renders Home on /', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /^Your system$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /add a part/i })).toBeInTheDocument();
});

test('renders Compare on /compare', () => {
  render(
    <MemoryRouter initialEntries={['/compare']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
});

test('renders Privacy policy on /privacy', () => {
  render(
    <MemoryRouter initialEntries={['/privacy']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Privacy Policy/i })).toBeInTheDocument();
  expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
});

test('renders the guides hub on /guides', () => {
  render(
    <MemoryRouter initialEntries={['/guides']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Guides & explainers/i })).toBeInTheDocument();
  // The nav's Guides menu lists the same article, so presence is the assertion.
  expect(screen.getAllByRole('link', { name: /PSU sizing explained/i }).length).toBeGreaterThan(0);
});

test('renders a guide article on /guides/:slug', () => {
  render(
    <MemoryRouter initialEntries={['/guides/india-tariff']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(
    screen.getByRole('heading', { name: /Understanding your electricity bill in India/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/min read/i)).toBeInTheDocument();
});
