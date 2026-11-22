const KEY = 'pc-power-consent';

export type ConsentState = 'granted' | 'denied' | 'unset';

type ConsentListener = () => void;

const listeners = new Set<ConsentListener>();

/**
 * Why the guard: the prerenderer renders every page in Node, where there is no
 * localStorage — and the "Manage analytics" link reads the stored consent
 * during render, not in an effect. Without this, enabling analytics (which
 * makes that link render) breaks the build.
 */
function storage(): Storage | undefined {
  return typeof localStorage === 'undefined' ? undefined : localStorage;
}

export function getConsent(): ConsentState {
  return (storage()?.getItem(KEY) as ConsentState) ?? 'unset';
}

/**
 * Subscribe to consent decisions.
 *
 * Why this exists: the PWA install prompt must not sit on screen while the
 * consent question is still open, so it needs to hear the moment the banner is
 * answered. The stored value alone is not enough — the answer happens after
 * the prompt has already mounted.
 *
 * Returns an unsubscribe function.
 */
export function onConsentChange(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setConsent(s: ConsentState): void {
  storage()?.setItem(KEY, s);
  // Why the guard: the prerenderer imports this module in Node, where there is
  // no window to notify.
  if (typeof window !== 'undefined') {
    for (const listener of listeners) listener();
  }
}
