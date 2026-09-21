// Site-specific GA4 Measurement ID for pcpower.concreteinfo.co.in.
// Configure via env var at build time: VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
export const GA4_MEASUREMENT_ID = (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID ?? '';
export const GA4_ENABLED = Boolean(GA4_MEASUREMENT_ID);