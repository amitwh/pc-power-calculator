import type { ReactNode } from 'react';
import TopNav from './TopNav';
import MobileNav from './MobileNav';
import { useInteractionCounter } from '@/hooks/useInteractionCounter';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function Layout({ children }: { children: ReactNode }) {
  // Track meaningful user interactions so the install prompt only fires after
  // a few clicks, not on first paint.
  useInteractionCounter('pc-power-install-prompt-count');
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <MobileNav />
      <PWAInstallPrompt />
    </div>
  );
}
