import { useEffect, useState } from 'react';
import { fetchFxRates } from '@/lib/api/fx';
import { getBundledFxSnapshot } from '@/lib/data/fx';
import type { FxSnapshot } from '@/types/currency';

export function useFx(): { snapshot: FxSnapshot; isLive: boolean } {
  const [snapshot, setSnapshot] = useState<FxSnapshot>(() => getBundledFxSnapshot());
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFxRates('USD').then((live) => {
      if (cancelled || !live) return;
      setSnapshot(live);
      setIsLive(true);
    });
    return () => { cancelled = true; };
  }, []);

  return { snapshot, isLive };
}