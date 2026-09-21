const KEY = 'pc-power-consent';

export type ConsentState = 'granted' | 'denied' | 'unset';

export function getConsent(): ConsentState {
  return (localStorage.getItem(KEY) as ConsentState) ?? 'unset';
}

export function setConsent(s: ConsentState): void {
  localStorage.setItem(KEY, s);
}