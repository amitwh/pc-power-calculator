import { useEffect, useMemo, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useBuildStore } from '@/store/buildStore';
import type { BuildConfig } from '@/types/build';

interface Props {
  onCompare: (b: BuildConfig[]) => void;
}

/**
 * Multi-system 2-build selector. Defaults to the first two builds in the
 * store (so the page is meaningful the moment the user lands on it) and
 * lets them choose any two via the dropdowns. No new store actions —
 * we read `builds` + `setActiveBuild` and pass the chosen configs up.
 */
export function BuildSelector({ onCompare }: Props) {
  const builds = useBuildStore((s) => s.builds);
  const setActiveBuild = useBuildStore((s) => s.setActiveBuild);

  const initial = useMemo(() => {
    const first = builds[0]?.id ?? '';
    const second = builds[1]?.id ?? builds[0]?.id ?? '';
    return { a: first, b: second };
  }, [builds]);

  const [buildAId, setBuildAId] = useState<string>(initial.a);
  const [buildBId, setBuildBId] = useState<string>(initial.b);

  // Keep the user's selection valid if the underlying list changes
  // (e.g. a build was removed from the store).
  useEffect(() => {
    if (!builds.some((x) => x.id === buildAId) && builds[0]) {
      setBuildAId(builds[0].id);
    }
    if ((!builds.some((x) => x.id === buildBId) || buildBId === buildAId) && builds[1]) {
      setBuildBId(builds[1].id);
    } else if ((!builds.some((x) => x.id === buildBId) || buildBId === buildAId) && builds[0]) {
      setBuildBId(builds[0].id);
    }
  }, [builds, buildAId, buildBId]);

  const options = builds.map((b) => ({ value: b.id, label: `${b.name}` }));

  const handleCompare = () => {
    const a = builds.find((x) => x.id === buildAId);
    const b = builds.find((x) => x.id === buildBId);
    if (!a || !b) return;
    setActiveBuild(a.id);
    onCompare([a, b]);
  };

  if (builds.length < 2) {
    return (
      <Card>
        <CardTitle>Compare systems</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add at least two systems on the Calculator page to compare them side by side.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Compare systems</CardTitle>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Pick two systems from your library to compare their yearly energy and cost.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor="cmp-a"
            className="block text-xs uppercase font-semibold text-gray-500 mb-1"
          >
            System A
          </label>
          <Select
            id="cmp-a"
            aria-label="System A"
            options={options}
            value={buildAId}
            onChange={(e) => setBuildAId(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cmp-b"
            className="block text-xs uppercase font-semibold text-gray-500 mb-1"
          >
            System B
          </label>
          <Select
            id="cmp-b"
            aria-label="System B"
            options={options}
            value={buildBId}
            onChange={(e) => setBuildBId(e.target.value)}
          />
        </div>
      </div>
      <Button className="mt-3" onClick={handleCompare}>
        Compare
      </Button>
    </Card>
  );
}
