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
      // Why the calc() on a phone: at `bottom-2` the chip sat on top of the
      // bottom nav, over its "About" tab. The nav is ~46px tall at `bottom-0`
      // plus the safe-area inset — 34px on a notched phone, so ~80px in
      // total, and a flat `bottom-20` would have left no clearance at all.
      // Adding the inset to the offset clears the nav on every device.
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-2 md:bottom-3 md:right-3 z-30 text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200 bg-white/70 dark:bg-gray-950/70 backdrop-blur px-2 py-1 rounded-8"
      // Why the label starts with the visible text: WCAG 2.5.3 (Label in Name)
      // requires the accessible name to contain the visible label, so a screen
      // reader user hearing "Manage privacy" can match what they see.
      aria-label={`${label} — open the privacy and analytics consent banner`}
    >
      {label}
    </button>
  );
}
