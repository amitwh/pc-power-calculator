import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `vi.mock` is hoisted above the imports, so any state shared with the mock
// factory has to be created via `vi.hoisted` — vitest hoists that too.
const { mockGtag } = vi.hoisted(() => ({
  mockGtag: {
    loadGtag: vi.fn(),
    grantAnalyticsConsent: vi.fn(),
    denyAnalyticsConsent: vi.fn(),
    event: vi.fn(),
    GA4_ENABLED: true,
  },
}));

// Default mock for every test: GA4 enabled, all gtag functions are spies.
// The "disabled" test below overrides GA4_ENABLED with resetModules + doMock.
vi.mock('@/lib/analytics/gtag', () => mockGtag);

import { CookieBanner } from '@/components/CookieBanner';
import { setConsent } from '@/lib/analytics/consent';

const KEY = 'pc-power-consent';

beforeEach(() => {
  localStorage.removeItem(KEY);
  mockGtag.loadGtag.mockClear();
  mockGtag.grantAnalyticsConsent.mockClear();
  mockGtag.denyAnalyticsConsent.mockClear();
  mockGtag.event.mockClear();
  // Mirror the real implementation: consent helpers also emit consent_update.
  mockGtag.grantAnalyticsConsent.mockImplementation(() => {
    mockGtag.event('consent_update', { state: 'granted' });
  });
  mockGtag.denyAnalyticsConsent.mockImplementation(() => {
    mockGtag.event('consent_update', { state: 'denied' });
  });
});

describe('CookieBanner', () => {
  test('renders both buttons when consent is "unset" and GA4 is enabled', () => {
    render(<CookieBanner />);
    expect(screen.getByRole('button', { name: /Allow analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Decline/i })).toBeInTheDocument();
  });

  test('clicking "Allow analytics" grants consent, hides banner, persists "granted"', async () => {
    const user = userEvent.setup();
    render(<CookieBanner />);
    await user.click(screen.getByRole('button', { name: /Allow analytics/i }));
    expect(mockGtag.grantAnalyticsConsent).toHaveBeenCalledTimes(1);
    expect(mockGtag.event).toHaveBeenCalledWith('consent_update', { state: 'granted' });
    expect(localStorage.getItem(KEY)).toBe('granted');
    expect(screen.queryByText(/Allow analytics/i)).not.toBeInTheDocument();
  });

  test('clicking "Decline" denies consent, hides banner, persists "denied"', async () => {
    const user = userEvent.setup();
    render(<CookieBanner />);
    await user.click(screen.getByRole('button', { name: /Decline/i }));
    expect(mockGtag.denyAnalyticsConsent).toHaveBeenCalledTimes(1);
    expect(mockGtag.event).toHaveBeenCalledWith('consent_update', { state: 'denied' });
    expect(localStorage.getItem(KEY)).toBe('denied');
    expect(screen.queryByText(/Allow analytics/i)).not.toBeInTheDocument();
  });

  test('does not render when consent is already "granted" on mount', () => {
    setConsent('granted');
    render(<CookieBanner />);
    expect(screen.queryByText(/Allow analytics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Decline/i)).not.toBeInTheDocument();
  });

  test('does not render when consent is already "denied" on mount', () => {
    setConsent('denied');
    render(<CookieBanner />);
    expect(screen.queryByText(/Allow analytics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Decline/i)).not.toBeInTheDocument();
  });
});

describe('CookieBanner when GA4 is disabled', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
  });

  test('renders nothing when GA4_ENABLED is false', async () => {
    vi.doMock('@/lib/analytics/gtag', () => ({
      loadGtag: vi.fn(),
      grantAnalyticsConsent: vi.fn(),
      denyAnalyticsConsent: vi.fn(),
      event: vi.fn(),
      GA4_ENABLED: false,
    }));
    const { CookieBanner: DisabledBanner } = await import('@/components/CookieBanner');
    render(<DisabledBanner />);
    expect(screen.queryByText(/Allow analytics/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Decline/i)).not.toBeInTheDocument();
  });
});