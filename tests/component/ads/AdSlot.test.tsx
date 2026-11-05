/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Ads-enabled mock (mirrors what a deployment with VITE_ADSENSE_CLIENT sees).
const { mockAdsense } = vi.hoisted(() => ({
  mockAdsense: {
    ADSENSE_CLIENT: 'ca-pub-1234567890123456',
    ADS_ENABLED: true,
    loadAdsense: vi.fn(() => Promise.resolve()),
  },
}));
vi.mock('@/lib/analytics/adsense', () => mockAdsense);

import { AdSlot } from '@/components/ads/AdSlot';
import { setConsent } from '@/lib/analytics/consent';

beforeEach(() => {
  localStorage.clear();
  mockAdsense.loadAdsense.mockClear();
  delete window.adsbygoogle;
});

afterEach(() => {
  delete window.adsbygoogle;
});

describe('AdSlot (deployment with VITE_ADSENSE_CLIENT set)', () => {
  test('renders nothing until the user grants consent', () => {
    render(<AdSlot slot="1234567" />);
    expect(document.querySelector('ins.adsbygoogle')).toBeNull();
    expect(mockAdsense.loadAdsense).not.toHaveBeenCalled();
  });

  test('renders nothing when consent was denied', () => {
    setConsent('denied');
    render(<AdSlot slot="1234567" />);
    expect(document.querySelector('ins.adsbygoogle')).toBeNull();
    expect(mockAdsense.loadAdsense).not.toHaveBeenCalled();
  });

  test('with granted consent: injects the ad unit and queues the push', async () => {
    setConsent('granted');
    render(<AdSlot slot="1234567" />);
    const ins = await waitFor(() => {
      const el = document.querySelector('ins.adsbygoogle');
      expect(el).not.toBeNull();
      return el!;
    });
    expect(ins.getAttribute('data-ad-client')).toBe('ca-pub-1234567890123456');
    expect(ins.getAttribute('data-ad-slot')).toBe('1234567');
    expect(mockAdsense.loadAdsense).toHaveBeenCalledTimes(1);
    // AdSlot queued the (window.adsbygoogle = ...).push({}) after loader resolved.
    expect((window.adsbygoogle ?? []).some((e) => Object.keys(e).length === 0)).toBe(true);
  });
});

describe('AdSlot when the deployment has no VITE_ADSENSE_CLIENT', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.resetModules();
  });

  test('renders nothing even with consent granted', async () => {
    vi.doMock('@/lib/analytics/adsense', () => ({
      ADSENSE_CLIENT: '',
      ADS_ENABLED: false,
      loadAdsense: vi.fn(() => Promise.resolve()),
    }));
    setConsent('granted');
    const { AdSlot: DisabledSlot } = await import('@/components/ads/AdSlot');
    render(<DisabledSlot slot="1234567" />);
    expect(document.querySelector('ins.adsbygoogle')).toBeNull();
  });
});
