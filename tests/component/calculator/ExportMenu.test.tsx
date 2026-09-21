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
});