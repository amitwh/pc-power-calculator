import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getConsent, setConsent } from '@/lib/analytics/consent';
import { grantAnalyticsConsent, denyAnalyticsConsent, loadGtag, GA4_ENABLED } from '@/lib/analytics/gtag';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA4_ENABLED) return;
    loadGtag();
    if (getConsent() === 'unset') setVisible(true);
  }, []);

  const accept = () => { setConsent('granted'); grantAnalyticsConsent(); setVisible(false); };
  const deny  = () => { setConsent('denied');  denyAnalyticsConsent();   setVisible(false); };

  if (!visible) return null;
  return (
    <div className="fixed bottom-16 md:bottom-4 inset-x-4 md:right-4 md:left-auto md:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-3 shadow-lg z-50">
      <div className="text-sm">We use Google Analytics to understand which components people configure. No personal data, no tracking across sites.</div>
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={accept}>Allow analytics</Button>
        <Button variant="secondary" onClick={deny}>Decline</Button>
      </div>
    </div>
  );
}