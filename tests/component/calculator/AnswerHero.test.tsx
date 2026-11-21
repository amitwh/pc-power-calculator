/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerHero } from '@/components/calculator/AnswerHero';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
});

describe('AnswerHero', () => {
  test('prompts instead of estimating when no parts are added', () => {
    render(<AnswerHero />);
    expect(screen.getByRole('heading', { name: /Yearly cost/i })).toBeInTheDocument();
    expect(screen.getByText(/Add a part to your system/i)).toBeInTheDocument();
    // No figure derived from the case-fan aggregate, and nothing to export.
    expect(screen.queryByText(/\/ year/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Share build/i })).not.toBeInTheDocument();
  });

  test('shows the yearly figure with month, day and energy beside it', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<AnswerHero />);

    expect(screen.getByText(/\/ year/)).toBeInTheDocument();
    expect(screen.getByText('Per month')).toBeInTheDocument();
    expect(screen.getByText('Per day')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    // The summary line names the part and the location.
    expect(screen.getByText(/Ryzen 7 7800X3D/)).toBeInTheDocument();
    expect(screen.getByText(/India/)).toBeInTheDocument();
  });

  test('warns when the selected PSU is undersized', () => {
    useBuildStore.getState().addComponent('gpu', 'gpu-nvidia-rtx-4090');
    useBuildStore.getState().addComponent('psu', 'psu-antec-truepower-430w');
    render(<AnswerHero />);
    expect(screen.getByText(/PSU is undersized/i)).toBeInTheDocument();
  });

  test('sharing copies the link and confirms it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    render(<AnswerHero />);

    await user.click(screen.getByRole('button', { name: /Copy permanent link/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\/build\/[A-Za-z0-9_-]+$/);
    expect(await screen.findByRole('status')).toHaveTextContent('Link copied');
  });
});
