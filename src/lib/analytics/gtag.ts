import { GA4_MEASUREMENT_ID, GA4_ENABLED } from './measurementId';

export { GA4_ENABLED };

declare global { interface Window { dataLayer: any[]; gtag?: (...args: any[]) => void } }

export function loadGtag(): void {
  if (!GA4_MEASUREMENT_ID || typeof document === 'undefined') return;
  if (document.getElementById('ga4-loader')) return;
  const s = document.createElement('script');
  s.id = 'ga4-loader';
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  // Consent Mode v2 — everything denied by default until the user opts in
  // (ad_* keys are meaningless without AdSense but kept for spec compliance).
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag('config', GA4_MEASUREMENT_ID, { anonymize_ip: true });
}

export function grantAnalyticsConsent(): void {
  window.gtag?.('consent', 'update', {
    analytics_storage: 'granted',
    // Ads stay non-personalized (ad_personalization stays denied) — granting
    // "Allow" in the banner permits ad delivery + measurement, not profiling.
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'denied',
  });
  event('consent_update', { state: 'granted' });
}

export function denyAnalyticsConsent(): void {
  window.gtag?.('consent', 'update', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  event('consent_update', { state: 'denied' });
}

export function event(name: string, params?: Record<string, unknown>): void {
  window.gtag?.('event', name, params);
}