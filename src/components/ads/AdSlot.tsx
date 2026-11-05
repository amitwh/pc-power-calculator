import { useEffect, useRef } from 'react';
import { ADS_ENABLED, ADSENSE_CLIENT, loadAdsense } from '@/lib/analytics/adsense';
import { getConsent } from '@/lib/analytics/consent';

interface AdSlotProps {
  /** AdSense ad-unit id (data-ad-slot) from the AdSense dashboard. */
  slot?: string;
  className?: string;
}

/**
 * Consent-gated AdSense placeholder. Renders nothing unless ALL of:
 *   - the deployment sets VITE_ADSENSE_CLIENT (build-time env),
 *   - the user explicitly granted consent ("Allow" in the banner).
 * With consent granted, pushes the <ins> into the adsbygoogle queue once the
 * loader script is ready. Failures are swallowed — ads must never break the UI.
 */
export function AdSlot({ slot, className }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!ADS_ENABLED) return;
    if (getConsent() !== 'granted') return;
    let cancelled = false;
    loadAdsense().then(() => {
      if (cancelled || !insRef.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle ?? []).push({});
      } catch {
        // loader missing or slot already pushed — non-fatal
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slot]);

  if (!ADS_ENABLED) return null;
  if (getConsent() !== 'granted') return null;

  return (
    <aside className={className} aria-label="Advertisement">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
