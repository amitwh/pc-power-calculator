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

test('renders the suggest form on /suggest', () => {
  render(
    <MemoryRouter initialEntries={['/suggest']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Suggest a part or correction/i })).toBeInTheDocument();
});

test('renders the feedback form on /feedback', () => {
  render(
    <MemoryRouter initialEntries={['/feedback']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Send feedback/i })).toBeInTheDocument();
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
  // The hub's visible title is a styled paragraph, not a heading: Layout
  // already renders the route's single sr-only h1, and the category headings
  // below it are the page's h2s (same convention as the home page).
  expect(screen.getByText('Guides & explainers')).toBeInTheDocument();
  // The nav's Guides menu lists the same article, so presence is the assertion.
  expect(screen.getAllByRole('link', { name: /PSU sizing explained/i }).length).toBeGreaterThan(0);
});

test('renders the about page on /about', () => {
  render(
    <MemoryRouter initialEntries={['/about']}>
      <Routes />
    </MemoryRouter>,
  );
  // The visible title is a styled paragraph, not a heading: Layout already
  // renders the route's single sr-only h1, so the section headings below it
  // are the page's h2s (same convention as the home page and the guides hub).
  expect(screen.getByText('About & methodology', { selector: 'p' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /More from ConcreteInfo/i })).toBeInTheDocument();
  // Each free tool is a heading that links to its source repository.
  for (const name of ['GitHub Desktop for Linux', 'CurveStudio', 'Markdown Converter']) {
    expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument();
  }
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

test('renders the user guide on /help', () => {
  render(
    <MemoryRouter initialEntries={['/help']}>
      <Routes />
    </MemoryRouter>,
  );
  // The hero's visible title is a styled paragraph, not a heading: Layout
  // already renders the route's single sr-only h1 (the nav also carries a
  // "Help" link, so the paragraph selector is what makes this unambiguous).
  expect(screen.getByText('Help', { selector: 'p' })).toBeInTheDocument();
  expect(screen.getByText('User guide')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Quick start/i })).toBeInTheDocument();
});

test('renders the open-source directory on /open-source', () => {
  render(
    <MemoryRouter initialEntries={['/open-source']}>
      <Routes />
    </MemoryRouter>,
  );
  // The hero's visible title is a styled paragraph, not a heading: Layout
  // already renders the route's single sr-only h1, so the project names below
  // it are the page's h2s.
  expect(screen.getByText('The open-source directory')).toBeInTheDocument();
  // Every project is a heading, and each carries its licence.
  for (const name of [
    'PC Power Calculator',
    'GitHub Desktop for Linux',
    'CurveStudio',
    'Markdown Converter',
    'ConcreteInfo',
  ]) {
    expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
  }
  // Two projects are MIT · TypeScript, so the count is the assertion there.
  expect(screen.getAllByText('MIT · TypeScript')).toHaveLength(2);
  expect(screen.getByText('AGPL-3.0 · Python/TypeScript')).toBeInTheDocument();
  expect(screen.getByText('MIT · JavaScript')).toBeInTheDocument();
});
