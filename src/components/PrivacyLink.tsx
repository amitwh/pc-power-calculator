import { GA4_ENABLED } from '@/lib/analytics/gtag';
import { ADS_ENABLED } from '@/lib/analytics/adsense';
import { getConsent } from '@/lib/analytics/consent';

// Tiny floating "Manage privacy" link at the bottom of every page so users who
// declined analytics/ads can change their mind without a hidden settings route.
// The full privacy policy itself lives at #/privacy (linked from both navs and
// the About page); this button exists to reopen the consent banner. When the
// deployment enables neither GA4 nor AdSense, it is meaningless and renders
// nothing.
export function PrivacyLink() {
  if (!GA4_ENABLED && !ADS_ENABLED) return null;

  const reopenBanner = () => {
    localStorage.removeItem('pc-power-consent');
    window.location.reload();
  };

  const label =
    getConsent() === 'granted' ? 'Manage analytics' : 'Manage privacy';

  return (
    <button
      type="button"
      onClick={reopenBanner}
      className="fixed bottom-2 right-2 md:bottom-3 md:right-3 z-30 text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200 bg-white/70 dark:bg-gray-950/70 backdrop-blur px-2 py-1 rounded-8"
      aria-label="Open privacy and analytics consent banner"
    >
      {label}
    </button>
  );
}
