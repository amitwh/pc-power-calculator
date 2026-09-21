/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportMenu } from '@/components/calculator/ExportMenu';
import { useBuildStore } from '@/store/buildStore';

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  // Vitest ships a partial URL.createObjectURL / revokeObjectURL polyfill that
  // breaks for our Blob in jsdom. Replace it with a no-op pair so the download
  // path in downloadExportHtml doesn't throw while tests still observe calls.
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = () => 'blob:test';
  (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => undefined;
});

describe('ExportMenu', () => {
  test('renders both Export PDF and Export HTML buttons', () => {
    render(<ExportMenu />);
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export HTML/i })).toBeInTheDocument();
  });

  test('clicking Export PDF calls window.print()', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    render(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Export PDF/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  test('clicking Export HTML triggers a download via createObjectURL', async () => {
    const user = userEvent.setup();
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    render(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Export HTML/i }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/html');
    createObjectURLSpy.mockRestore();
  });

  test('uses the active build currency_override (USD) in the exported HTML', async () => {
    const user = userEvent.setup();
    // Active build starts with no currency_override → ExportMenu falls back to INR.
    useBuildStore.getState().setCurrency('USD');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const { rerender } = render(<ExportMenu />);
    // Re-render so the store subscription picks up the new override before the click.
    rerender(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Export HTML/i }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const html = await blob.text();
    // USD was wired through: findCurrency('USD') → symbol '$' must appear, INR ₹ must not.
    expect(html).toContain('$');
    expect(html).not.toContain('₹');
    createObjectURLSpy.mockRestore();
  });

  test('falls back to INR (₹) when the active build has no currency_override', async () => {
    const user = userEvent.setup();
    // Defensive: a previous test may have set currency_override to USD; clear it.
    useBuildStore.getState().setCurrency('');
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');
    const { rerender } = render(<ExportMenu />);
    rerender(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Export HTML/i }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
    const html = await blob.text();
    expect(html).toContain('₹');
    expect(html).not.toContain('$');
    createObjectURLSpy.mockRestore();
  });
});