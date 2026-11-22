import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { getConsent, setConsent } from '@/lib/analytics/consent';
import { grantAnalyticsConsent, denyAnalyticsConsent, loadGtag, GA4_ENABLED } from '@/lib/analytics/gtag';
import { ADS_ENABLED } from '@/lib/analytics/adsense';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA4_ENABLED && !ADS_ENABLED) return;
    loadGtag();
    if (getConsent() === 'unset') setVisible(true);
  }, []);

  const accept = () => { setConsent('granted'); grantAnalyticsConsent(); setVisible(false); };
  const deny  = () => { setConsent('denied');  denyAnalyticsConsent();   setVisible(false); };

  if (!visible) return null;
  return (
    // Why the landmark: the banner floats over the page rather than sitting
    // inside the main region, so without a role its text is page content
    // outside every landmark — which axe flags as "region".
    <div
      role="region"
      aria-label="Analytics consent"
      // Why `bottom-32` on a phone: the bottom nav is ~46px tall and the
      // "Manage privacy" chip sits at `bottom-20`, so the banner has to
      // clear both or it covers them. On a desktop there is no bottom nav,
      // so it drops back into the corner.
      // Why the smaller type on a phone: the panel used to run ~200px tall
      // and cover a whole card of content. At `text-xs` it is a third
      // shorter, and the 16px gutter keeps it off the screen edges.
      className="fixed bottom-32 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-3 shadow-lg z-50"
    >
      <div className="text-xs md:text-sm">
        We use Google Analytics to understand which components people configure. No personal
        data, no tracking across sites.
        {ADS_ENABLED && (
          <> Ads load only after you allow, and are served non-personalized. See the{' '}
            <Link className="underline underline-offset-2" to="/privacy">privacy policy</Link>.</>
        )}
      </div>
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={accept}>Allow analytics</Button>
        <Button variant="secondary" onClick={deny}>Decline</Button>
      </div>
    </div>
  );
}
