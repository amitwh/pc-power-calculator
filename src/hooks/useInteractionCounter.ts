import { useEffect } from 'react';

// Increments a localStorage counter every time the user clicks anywhere in the
// app. Other components (PWAInstallPrompt) read the counter and decide when to
// show up. The `threshold` parameter is reserved for callers that want to
// pre-empt the read; the counter itself is just a number on disk.
export function useInteractionCounter(key: string, threshold = 3) {
  useEffect(() => {
    const handler = () => {
      const count = Number(localStorage.getItem(key) ?? 0) + 1;
      localStorage.setItem(key, String(count));
    };
    document.addEventListener('click', handler, { once: false });
    return () => document.removeEventListener('click', handler);
  }, [key, threshold]);
}
