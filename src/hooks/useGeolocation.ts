import { useState } from 'react';
import { detectLocation } from '@/lib/api/geolocation';
import { useBuildStore } from '@/store/buildStore';

/**
 * Manual geolocation helper.
 *
 * Geolocation auto-fires on mount would mean every visitor triggers a
 * third-party IP lookup the moment the app loads, without their consent.
 * This hook intentionally does NOT auto-fire. The caller (e.g. the
 * LocationPicker's "Detect from IP ↻" button) must invoke `detect()`
 * explicitly in response to a user action.
 */
export function useGeolocation(): { loading: boolean; detect: () => Promise<void> } {
  const [loading, setLoading] = useState(false);
  const setLocation = useBuildStore((s) => s.setLocation);

  async function detect(): Promise<void> {
    if (loading) return;
    setLoading(true);
    try {
      const r = await detectLocation();
      if (r) setLocation(r.country_iso2, r.subdivision);
    } finally {
      setLoading(false);
    }
  }

  return { loading, detect };
}
