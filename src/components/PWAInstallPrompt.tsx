import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'pc-power-install-prompt-count';

// Captures the deferred-install prompt from the browser and shows our own
// card after the user has actually engaged with the app a few times
// (counter is incremented in useInteractionCounter). Avoids pinging first-time
// visitors who haven't decided whether the app is worth installing.
export function PWAInstallPrompt() {
  const [evt, setEvt] = useState<any>(null);

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

  if (!evt) return null;
  return (
    <div className="fixed bottom-16 md:bottom-4 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-3 shadow-lg z-40">
      <div className="font-display font-semibold">Install PC Power Calculator</div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Add to your home screen for quick access.</p>
      <div className="flex gap-2 mt-2">
        <Button variant="primary" onClick={async () => { await evt.prompt(); setEvt(null); localStorage.setItem(STORAGE_KEY, '0'); }}>Install</Button>
        <Button variant="secondary" onClick={() => setEvt(null)}>Not now</Button>
      </div>
    </div>
  );
}
