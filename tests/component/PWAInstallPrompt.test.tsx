import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `vi.mock` is hoisted above the imports, so any state shared with the mock
// factory has to be created via `vi.hoisted`.
const { mockGtag } = vi.hoisted(() => ({
  mockGtag: { GA4_ENABLED: true },
}));

vi.mock('@/lib/analytics/gtag', () => mockGtag);

vi.mock('@/lib/analytics/adsense', () => ({
  ADSENSE_CLIENT: '',
  ADS_ENABLED: false,
  AD_SLOTS: {},
  loadAdsense: vi.fn(),
}));

import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { setConsent } from '@/lib/analytics/consent';

const STORAGE_KEY = 'pc-power-install-prompt-count';
const CONSENT_KEY = 'pc-power-consent';

/** The browser's deferred-install event, as the component sees it. */
function fireBeforeInstallPrompt(): void {
  const event = new Event('beforeinstallprompt');
  (event as any).preventDefault = vi.fn();
  (event as any).prompt = vi.fn().mockResolvedValue(undefined);
  window.dispatchEvent(event);
}

beforeEach(() => {
  localStorage.removeItem(CONSENT_KEY);
  // The prompt only appears after the reader has interacted with the app a
  // few times, so the counter has to be past that threshold.
  localStorage.setItem(STORAGE_KEY, '5');
});

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe('PWAInstallPrompt', () => {
  test('stays hidden while the consent question is still open', () => {
    render(<PWAInstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.queryByText('Install PC Power Calculator')).not.toBeInTheDocument();
  });

  test('appears once the consent question has been answered', () => {
    render(<PWAInstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.queryByText('Install PC Power Calculator')).not.toBeInTheDocument();

    act(() => {
      setConsent('granted');
    });
    expect(screen.getByText('Install PC Power Calculator')).toBeInTheDocument();
  });

  test('appears straight away when consent was already answered', () => {
    setConsent('denied');
    render(<PWAInstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.getByText('Install PC Power Calculator')).toBeInTheDocument();
  });

  test('"Not now" dismisses the card', async () => {
    const user = userEvent.setup();
    setConsent('granted');
    render(<PWAInstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText('Install PC Power Calculator')).not.toBeInTheDocument();
  });
});

describe('PWAInstallPrompt when analytics is disabled', () => {
  test('is not blocked by a consent question that is never asked', async () => {
    vi.resetModules();
    vi.doMock('@/lib/analytics/gtag', () => ({ GA4_ENABLED: false }));
    const { PWAInstallPrompt: Unblocked } = await import('@/components/PWAInstallPrompt');
    render(<Unblocked />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.getByText('Install PC Power Calculator')).toBeInTheDocument();
  });
});
