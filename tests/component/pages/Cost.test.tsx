/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Routes from '@/routes';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes />
    </MemoryRouter>,
  );
}

describe('/cost/:country/:state', () => {
  test('renders the Maharashtra headline, its slab rates and a non-zero worked cost', () => {
    renderAt('/cost/in/mh');

    expect(
      screen.getByRole('heading', { level: 1, name: /Maharashtra, India/ }),
    ).toBeInTheDocument();

    // MSEDCL's first slab rate.
    expect(screen.getByText(/5\.67/)).toBeInTheDocument();

    const row = screen.getByRole('row', { name: /350 W PC/ });
    expect(row).toHaveTextContent(/₹[1-9][\d,]*\.\d{2} \/ month/);
  });

  test('renders the "Tariff not found" block for an unknown country', () => {
    renderAt('/cost/zz');

    expect(screen.getByRole('heading', { name: /Tariff not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the calculator/i })).toBeInTheDocument();
  });
});
