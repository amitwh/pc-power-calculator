import { useEffect, useState } from 'react';
import { detectLocation } from '@/lib/api/geolocation';
import { useBuildStore } from '@/store/buildStore';

const GEO_FLAG = 'pc-power-geo-detected';

/**
 * Is the page opening someone else's build? A shared configuration carries its
 * own tariff, so auto-detecting the visitor's region here would silently
 * rewrite the location they were sent — a US build would arrive as ₹ at the
 * recipient's local rate.
 */
function openingSharedBuild(): boolean {
  if (typeof window === 'undefined') return false;
  return /^\/build\//.test(window.location.pathname) || /[?&]builds=/.test(window.location.search);
}

/**
 * Geolocation helper.
 *
 * `detect()` runs on explicit user action (the "Detect from IP ↻" button).
 * `autoDetectOnce()` resolves the location a single time per browser — on the
 * visitor's first load only (flag in localStorage), never on subsequent
 * visits, and never when the browser signals Do Not Track or Global Privacy
 * Control. It exists so the default tariff matches the visitor's region
 * without them having to find the picker; any further third-party lookup
 * still requires the button.
 */
export function useGeolocation(): {
  loading: boolean;
  detect: () => Promise<void>;
  autoDetectOnce: () => void;
} {
  const [loading, setLoading] = useState(false);
  const setLocation = useBuildStore((s) => s.setLocation);

  async function detect(): Promise<void> {
    if (loading) return;
    setLoading(true);
    try {
      const r = await detectLocation();
      if (r) {
        setLocation(r.country_iso2, r.subdivision);
        try { localStorage.setItem(GEO_FLAG, '1'); } catch { /* private mode */ }
      }
    } finally {
      setLoading(false);
    }
  }

  function autoDetectOnce(): void {
    // A shared build is the whole point of the visit — leave its tariff alone.
    if (openingSharedBuild()) return;
    try {
      if (localStorage.getItem(GEO_FLAG)) return;
      const dnt = navigator.doNotTrack === '1' || (window as { doNotTrack?: string }).doNotTrack === '1';
      const gpc = (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
      if (dnt || gpc) return;
    } catch { /* storage unavailable — skip auto-detect */ return; }
    void detect();
  }

  // Auto-resolve once per browser so the default tariff matches the visitor's
  // region; the effect runs on mount and is a no-op afterwards.
  useEffect(() => {
    autoDetectOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loading, detect, autoDetectOnce };
}
