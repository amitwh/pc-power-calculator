import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getConsent } from '@/lib/analytics/consent';
import { event } from '@/lib/analytics/gtag';

// Fires a `page_view` analytics event on every client-side route change,
// gated by Consent Mode v2 — only emits when the user has opted in.
export function usePageView(): void {
  const location = useLocation();
  useEffect(() => {
    if (getConsent() === 'granted') {
      event('page_view', { path: location.pathname });
    }
  }, [location.pathname]);
}