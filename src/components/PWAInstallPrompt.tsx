import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getConsent, onConsentChange } from '@/lib/analytics/consent';
import { GA4_ENABLED } from '@/lib/analytics/gtag';
import { ADS_ENABLED } from '@/lib/analytics/adsense';

const STORAGE_KEY = 'pc-power-install-prompt-count';

/**
 * Has the consent question been answered?
 *
 * Why: the consent banner is a legal requirement and has to be visible; the
 * install prompt is only a nicety. So the prompt waits until the banner has
 * been answered — either way — before it shows, and the two are never on
 * screen together. With no analytics configured there is no question to ask,
 * so the prompt is never blocked.
 */
function consentSettled(): boolean {
  if (!GA4_ENABLED && !ADS_ENABLED) return true;
  return getConsent() !== 'unset';
}

// Captures the deferred-install prompt from the browser and shows our own
// card after the user has actually engaged with the app a few times
// (counter is incremented in useInteractionCounter). Avoids pinging first-time
// visitors who haven't decided whether the app is worth installing.
export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<any>(null);
  const [settled, setSettled] = useState(consentSettled);

  useEffect(() => {
    const handler = (e: any) => {
      const count = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
      if (count < 3) return;
      e.preventDefault();
      setEvt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // The banner is answered after this component has already mounted, so the
    // prompt has to hear about it rather than read the flag once at startup.
    return onConsentChange(() => setSettled(consentSettled()));
  }, []);

  if (!evt || !settled) return null;
  return (
    // Why `bottom-32` on a phone: the bottom nav is ~46px tall and the
    // "Manage privacy" chip sits at `bottom-20`, so the prompt has to clear
    // both. On a desktop there is no bottom nav, so it sits in the corner.
    <div className="fixed bottom-32 left-4 right-4 md:bottom-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-3 shadow-lg z-40">
      <div className="font-display font-semibold">Install PC Power Calculator</div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Add to your home screen for quick access.</p>
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={async () => { await evt.prompt(); setEvt(null); localStorage.setItem(STORAGE_KEY, '0'); }}>Install</Button>
        <Button variant="secondary" onClick={() => setEvt(null)}>Not now</Button>
      </div>
    </div>
  );
}
