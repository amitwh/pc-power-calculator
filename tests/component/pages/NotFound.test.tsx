/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Routes from '@/routes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
    </MemoryRouter>,
  );
}

describe('unknown routes', () => {
  test('render the catch-all Page not found card with links home and to guides', () => {
    renderAt('/not-a-route');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the calculator' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'guides' })).toHaveAttribute('href', '/guides');
  });
});
