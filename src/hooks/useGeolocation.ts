import { useEffect, useState } from 'react';
import { detectLocation } from '@/lib/api/geolocation';
import { useBuildStore } from '@/store/buildStore';

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const setLocation = useBuildStore((s) => s.setLocation);
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const activeBuild = builds.find((b) => b.id === activeBuildId);
  const detected = Boolean(activeBuild?.location.subdivision_code);

  useEffect(() => {
    if (detected) return;
    let cancelled = false;
    setLoading(true);
    detectLocation().then((r) => {
      if (cancelled) return;
      if (r) setLocation(r.country_iso2, r.subdivision);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [detected, setLocation]);

  return { loading };
}