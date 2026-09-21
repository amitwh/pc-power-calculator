export const ENDPOINTS = {
  geoIp: 'https://ipapi.co/json/',
  fxLatest: (base: string) => `https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}`,
  timeoutMs: 3000,
} as const;