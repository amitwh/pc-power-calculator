/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportMenu } from '@/components/calculator/ExportMenu';
import { useBuildStore } from '@/store/buildStore';
import { exportPdf, type PdfReport } from '@/lib/export/pdf';

// jsPDF rendering is browser-heavy; the wiring test only asserts the report
// ExportMenu assembles before handing it to the generator.
vi.mock('@/lib/export/pdf', () => ({ exportPdf: vi.fn().mockResolvedValue(undefined) }));

beforeEach(() => {
  localStorage.clear();
  useBuildStore.getState().resetAll();
  vi.mocked(exportPdf).mockClear();
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

  test('Export PDF generates a report with device quantities and totals', async () => {
    const user = userEvent.setup();
    useBuildStore.getState().addComponent('ram', 'ram-corsair-vengeance-32gb-ddr5-5600');
    useBuildStore.getState().setQty('ram-corsair-vengeance-32gb-ddr5-5600', 4);
    render(<ExportMenu />);
    await user.click(screen.getByRole('button', { name: /Export PDF/i }));
    await waitFor(() => expect(exportPdf).toHaveBeenCalledTimes(1));
    const report = vi.mocked(exportPdf).mock.calls[0][0] as PdfReport;
    expect(report.buildName).toBe('My build');
    const ram = report.devices.find((d) => d.name.includes('Vengeance 32GB'));
    expect(ram?.qty).toBe(4);
    expect(ram?.totalW).toBe((ram?.unitW ?? 0) * 4);
    expect(report.totals.yearly.kwh).toBeGreaterThan(0);
    expect(report.schedule.length).toBeGreaterThan(0);
    expect(report.peakWallDrawW).toBeGreaterThan(0);
    expect(report.recommendedPsuW).toBeGreaterThan(0);
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
