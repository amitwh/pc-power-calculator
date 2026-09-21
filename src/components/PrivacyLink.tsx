import { GA4_ENABLED } from '@/lib/analytics/gtag';
import { getConsent } from '@/lib/analytics/consent';

// Tiny floating "Privacy" link at the bottom of every page so users who
// declined analytics can change their mind without a hidden settings route.
// GDPR-aware — when GA is fully disabled (VITE_GA4_MEASUREMENT_ID unset),
// the link is meaningless, so we render nothing.
export function PrivacyLink() {
  if (!GA4_ENABLED) return null;

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