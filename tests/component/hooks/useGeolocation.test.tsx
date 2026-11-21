/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom/vitest" />
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBuildStore } from '@/store/buildStore';

// The hook reaches the network through this module; stub it so the test can
// assert whether a lookup was attempted at all.
const detectLocation = vi.fn();
vi.mock('@/lib/api/geolocation', () => ({ detectLocation: () => detectLocation() }));

const { useGeolocation } = await import('@/hooks/useGeolocation');

beforeEach(() => {
  localStorage.clear();
  detectLocation.mockReset();
  detectLocation.mockResolvedValue({ country_iso2: 'IN', subdivision: 'IN-MH' });
  useBuildStore.getState().resetAll();
  window.history.replaceState(null, '', '/');
});

describe('useGeolocation auto-detect', () => {
  test('resolves the visitor region once on a plain visit', async () => {
    renderHook(() => useGeolocation());
    await waitFor(() => expect(detectLocation).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(useBuildStore.getState().builds[0].location.subdivision_code).toBe('IN-MH'),
    );
  });

  test('never overwrites the tariff of a /build/<token> permalink', async () => {
    window.history.replaceState(null, '', '/build/abc123');
    renderHook(() => useGeolocation());
    // Give any stray promise a turn before asserting the negative.
    await new Promise((r) => setTimeout(r, 20));
    expect(detectLocation).not.toHaveBeenCalled();
    expect(useBuildStore.getState().builds[0].location.subdivision_code).toBeUndefined();
  });

  test('never overwrites the tariff of a ?builds= shared link', async () => {
    window.history.replaceState(null, '', '/?builds=eyJ2ZXJzaW9uIjoxfQ');
    renderHook(() => useGeolocation());
    await new Promise((r) => setTimeout(r, 20));
    expect(detectLocation).not.toHaveBeenCalled();
  });

  test('the explicit Detect button still works on a shared build', async () => {
    window.history.replaceState(null, '', '/build/abc123');
    const { result } = renderHook(() => useGeolocation());
    await result.current.detect();
    expect(detectLocation).toHaveBeenCalledTimes(1);
    expect(useBuildStore.getState().builds[0].location.subdivision_code).toBe('IN-MH');
  });
});
