import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { getConsent, setConsent } from '@/lib/analytics/consent';

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