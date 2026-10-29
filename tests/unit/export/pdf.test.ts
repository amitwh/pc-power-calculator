/// <reference types="vitest/globals" />
import { describe, expect, test } from 'vitest';
import { pdfMoney, pdfText } from '@/lib/export/pdf';
import { findCurrency } from '@/lib/data/currencies';

describe('pdf text sanitization (WinAnsi-safe)', () => {
  test('maps the rupee sign to an ASCII-safe prefix', () => {
    expect(pdfText('₹1,234.00')).toBe('Rs. 1,234.00');
    expect(pdfText('Costs ₹5')).not.toContain('₹');
  });

  test('replaces typographic glyphs jsPDF core fonts cannot render', () => {
    const out = pdfText('2× GPU — OK “quoted”');
    expect(out).toBe('2x GPU - OK "quoted"');
  });

  test('strips codepoints outside the WinAnsi range', () => {
    expect(pdfText('ok \u20b9\u4f60\u597d fine')).toBe('ok Rs.  fine');
  });

  test('pdfMoney renders INR amounts without the rupee glyph', () => {
    const inr = findCurrency('INR');
    expect(inr).toBeDefined();
    const out = pdfMoney(1234.5, inr!);
    expect(out).not.toContain('₹');
    expect(out).toMatch(/Rs\.?\s*1,234\.50/);
  });
});
