import { useEffect, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';

/**
 * Rehydrate persisted store state after the first client render.
 *
 * The store opts out of automatic hydration (skipHydration) so the client's
 * first render matches the prerendered HTML exactly; localStorage is applied
 * in this effect instead.
 */
export function useStoreHydration(): void {
  useEffect(() => {
    void useBuildStore.persist.rehydrate();
  }, []);
}

/**
 * Observe whether the persisted store has finished rehydrating.
 *
 * Anything that writes to the store before localStorage has been applied would
 * be persisted over the visitor's saved builds, so mount-time work (importing
 * a `?builds=` link, seeding a `?part=`) waits for this to turn true. The state
 * starts from the current flag, so a component mounted after rehydration has
 * already run starts hydrated rather than waiting for an event that already fired.
 */
export function useStoreHydrated(): boolean {
  // Zustand omits `persist` entirely when storage is unavailable (the
  // build-time prerender, or a browser that blocks localStorage).
  const [hydrated, setHydrated] = useState(() => {
    const persist = useBuildStore.persist;
    return typeof window !== 'undefined' && !!persist && persist.hasHydrated();
  });

  useEffect(() => {
    const persist = useBuildStore.persist;
    // No persistence: there is nothing to wait for, so let page effects run.
    if (!persist) {
      setHydrated(true);
      return;
    }
    if (persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
