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

    // Each fact carries its own hue, in a fixed order, so the figures read
    // apart without re-reading the labels (--color-fact-* in tokens.css).
    const tones = ['Per month', 'Per day', 'Energy'].map((label) => {
      const value = screen.getByText(label).closest('div')!.querySelector('dd')!;
      return value.className.match(/text-fact-\w+/)?.[0];
    });
    expect(tones).toEqual(['text-fact-month', 'text-fact-day', 'text-fact-energy']);
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

  test('recommends a PSU, with the wattage, when the build has none', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().addComponent('gpu', 'gpu-nvidia-rtx-4070');
    render(<AnswerHero />);

    expect(screen.getByText(/no PSU in this build/i)).toBeInTheDocument();
    // 120 W + 200 W at the wall, +35% headroom → the next standard step up.
    expect(screen.getByText('450 W')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add a power supply/i })).toBeInTheDocument();
    // A recommendation, not a warning — no alarm about a unit that is not there.
    expect(screen.queryByText(/PSU is undersized/i)).not.toBeInTheDocument();
  });

  test('says nothing about PSUs once one is installed', () => {
    useBuildStore.getState().addComponent('cpu', 'cpu-amd-ryzen-7-7800x3d');
    useBuildStore.getState().addComponent('gpu', 'gpu-nvidia-rtx-4070');
    useBuildStore.getState().addComponent('psu', 'psu-bequiet-system-power-10-650w');
    render(<AnswerHero />);

    expect(screen.queryByText(/no PSU in this build/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add a power supply/i })).not.toBeInTheDocument();
    // 650 W is enough for the 450 W recommendation, so there is no warning either.
    expect(screen.queryByText(/PSU is undersized/i)).not.toBeInTheDocument();
  });

  test('does not recommend a PSU for an empty build', () => {
    render(<AnswerHero />);
    // recommendPsuW(0) is 300 W — a meaningless recommendation for no parts.
    expect(screen.queryByText(/no PSU in this build/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add a power supply/i })).not.toBeInTheDocument();
    expect(screen.queryByText('300 W')).not.toBeInTheDocument();
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
