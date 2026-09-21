/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { render, screen } from '@testing-library/react';
import App from '@/App';

test('renders app title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /PC Power Calculator/i })).toBeInTheDocument();
});
