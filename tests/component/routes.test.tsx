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
  // BuildPicker's heading is "1 Your Systems" (step badge + title); the multi-system
  // summary card in ResultsPanel also contains "your systems", so anchor exactly.
  expect(screen.getByRole('heading', { name: /^1\s*Your Systems$/i })).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: /Select CPU/i })).toBeInTheDocument();
});

test('renders Compare on /compare', () => {
  render(
    <MemoryRouter initialEntries={['/compare']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
});
