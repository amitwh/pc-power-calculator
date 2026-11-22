import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { getConsent, setConsent, onConsentChange } from '@/lib/analytics/consent';

const KEY = 'pc-power-consent';

beforeEach(() => {
  localStorage.removeItem(KEY);
});

afterEach(() => {
  localStorage.removeItem(KEY);
});

describe('consent', () => {
  test('initial state is "unset" when localStorage has no value', () => {
    expect(getConsent()).toBe('unset');
  });

  test('setConsent("granted") persists across getConsent calls', () => {
    setConsent('granted');
    expect(getConsent()).toBe('granted');
  });

  test('setConsent("denied") persists across getConsent calls', () => {
    setConsent('denied');
    expect(getConsent()).toBe('denied');
  });
});

describe('onConsentChange', () => {
  test('notifies the listener when the consent state is written', () => {
    const listener = vi.fn();
    const off = onConsentChange(listener);
    setConsent('granted');
    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });

  test('stops notifying after the unsubscribe function is called', () => {
    const listener = vi.fn();
    const off = onConsentChange(listener);
    off();
    setConsent('denied');
    expect(listener).not.toHaveBeenCalled();
  });
});