// Google AdSense loader — mirrors the gtag pattern: dead code unless the
// deployment sets VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX at build time.
// Until then nothing is fetched, nothing renders, and the CSP additions for
// ad hosts are inert.

export const ADSENSE_CLIENT: string =
  (import.meta as any).env?.VITE_ADSENSE_CLIENT ?? '';
export const ADS_ENABLED = Boolean(ADSENSE_CLIENT);

interface AdsbygoogleArray extends Array<Record<string, unknown>> {
  requestNonPersonalizedAds?: number;
}

declare global {
  interface Window {
    adsbygoogle?: AdsbygoogleArray;
  }
}

let loaderPromise: Promise<void> | null = null;

/**
 * Inject the adsbygoogle.js loader once. Resolves (never rejects) even on
 * network/ad-blocker failure so UI code can't be broken by ad infrastructure.
 * Ads are requested non-personalized by default — personalization would
 * additionally require a Google-certified CMP in EEA/UK, which this app
 * deliberately does not assume.
 */
export function loadAdsense(): Promise<void> {
  if (!ADS_ENABLED || typeof document === 'undefined') return Promise.resolve();
  loaderPromise ??= new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.id = 'adsense-loader';
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
    s.addEventListener('load', () => resolve());
    s.addEventListener('error', () => resolve());
    document.head.appendChild(s);
    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.requestNonPersonalizedAds = 1;
  });
  return loaderPromise;
}
