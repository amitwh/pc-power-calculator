/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpTip } from '@/components/ui/HelpTip';

describe('HelpTip', () => {
  test('wires the focusable mark to its tooltip bubble', () => {
    render(<HelpTip text="Explains the control" label="About the control" />);

    const mark = screen.getByRole('button', { name: 'About the control' });
    const tip = screen.getByRole('tooltip');

    expect(tip).toHaveTextContent('Explains the control');
    expect(mark).toHaveAttribute('aria-describedby', tip.id);
  });

  test('defaults the accessible label to "Help"', () => {
    render(<HelpTip text="Short explanation" />);
    expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
  });
});
