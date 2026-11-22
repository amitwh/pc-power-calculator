const KEY = 'pc-power-consent';

export type ConsentState = 'granted' | 'denied' | 'unset';

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

export function setConsent(s: ConsentState): void {
  storage()?.setItem(KEY, s);
}
