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
  // BuildPicker's heading is "Your Systems" (+ a device-count span); the
  // multi-system summary card in ResultsPanel also contains "your systems",
  // so anchor on the title prefix.
  expect(screen.getByRole('heading', { name: /^Your Systems/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Add device' })).toBeInTheDocument();
});

test('renders Compare on /compare', () => {
  render(
    <MemoryRouter initialEntries={['/compare']}>
      <Routes />
    </MemoryRouter>,
  );
  expect(screen.getByRole('heading', { name: /Compare/i })).toBeInTheDocument();
});
