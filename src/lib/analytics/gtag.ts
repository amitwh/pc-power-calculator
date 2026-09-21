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
  // Consent Mode v2 — denied by default until user opts in.
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
  window.gtag('config', GA4_MEASUREMENT_ID, { anonymize_ip: true });
}

export function grantAnalyticsConsent(): void {
  window.gtag?.('consent', 'update', { analytics_storage: 'granted' });
}

export function denyAnalyticsConsent(): void {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
}

export function event(name: string, params?: Record<string, unknown>): void {
  window.gtag?.('event', name, params);
}