import type { ReactNode } from 'react';
import TopNav from './TopNav';
import MobileNav from './MobileNav';
import { useInteractionCounter } from '@/hooks/useInteractionCounter';
import { usePageView } from '@/hooks/usePageView';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { CookieBanner } from '@/components/CookieBanner';
import { PrivacyLink } from '@/components/PrivacyLink';
import { AdSlot } from '@/components/ads/AdSlot';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Layout({ children }: { children: ReactNode }) {
  // Track meaningful user interactions so the install prompt only fires after
  // a few clicks, not on first paint.
  useInteractionCounter('pc-power-install-prompt-count');
  // GA4 page_view tracker — gated by Consent Mode v2, no-op when consent is denied.
  usePageView();
  // Per-route <title> + canonical link for crawlers that render JS.
  usePageMeta();
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Visually-hidden h1 — satisfies WCAG page-has-heading-one and gives
            screen-reader users a single, consistent top-level heading for the
            app. The branded logo in <TopNav /> remains the visible identity. */}
        <h1 className="sr-only">PC Power Calculator</h1>
        {children}
        {/* Consent-gated ad placeholder — renders nothing until the deployment
            sets VITE_ADSENSE_CLIENT and the user opts in. */}
        <AdSlot className="mx-4 md:mx-8 mb-4" />
      </main>
      <MobileNav />
      <PWAInstallPrompt />
      <CookieBanner />
      <PrivacyLink />
    </div>
  );
}
