import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { useBuildStore } from '@/store/buildStore';
import type { BuildConfig } from '@/types/build';

interface Props {
  onCompare: (b: BuildConfig[]) => void;
  /** Pre-select this build id in slot B (e.g. a build imported from an exported HTML link). */
  initialBId?: string;
  /** Notifies the parent when the visitor changes a dropdown themselves. */
  onUserSelect?: () => void;
}

/**
 * Multi-system 2-build selector. Defaults to the first two builds in the
 * store (so the page is meaningful the moment the user lands on it) and
 * fires `onCompare` LIVE on mount and whenever the selection changes —
 * no submit button needed.
 */
export function BuildSelector({ onCompare, initialBId, onUserSelect }: Props) {
  const builds = useBuildStore((s) => s.builds);
  // Once the visitor picks a pair, automatic resyncs must leave it alone.
  const userSelected = useRef(false);

  const initial = useMemo(() => {
    const first = builds[0]?.id ?? '';
    const second = initialBId ?? builds[1]?.id ?? builds[0]?.id ?? '';
    return { a: first, b: second };
    // initialBId is only meaningful on first mount (imported-link flow).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [buildAId, setBuildAId] = useState<string>(initial.a);
  const [buildBId, setBuildBId] = useState<string>(initial.b);

  // An imported build can land after this component mounts — the store is
  // rehydrated and `?builds=` is imported in effects. Pin slot B to it once it
  // appears, unless the visitor has already chosen a pair themselves.
  useEffect(() => {
    if (!initialBId || userSelected.current) return;
    if (!builds.some((x) => x.id === initialBId)) return;
    setBuildBId((prev) => (prev === initialBId ? prev : initialBId));
  }, [initialBId, builds]);

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

  // Live comparison: fire on mount and on every selection change.
  const selectionKey = `${buildAId}|${buildBId}|${builds.length}`;
  useEffect(() => {
    const a = builds.find((x) => x.id === buildAId);
    const b = builds.find((x) => x.id === buildBId);
    // A single build cannot be compared with itself: on the first render the
    // store has one build and both slots fall back to it. Reporting that pair
    // would duplicate React keys and leave stale rows after hydration.
    if (a && b && a.id !== b.id) onCompare([a, b]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey]);

  const options = builds.map((b) => ({ value: b.id, label: `${b.name}` }));

  if (builds.length < 2) {
    return (
      <Card>
        <CardTitle className="text-base!">Compare systems</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add at least two systems on the Calculator page to compare them.{' '}
          <Link to="/" className="text-brand-text underline font-medium">
            Go to the calculator
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle className="text-base!">Compare systems</CardTitle>
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
            onChange={(e) => {
              userSelected.current = true;
              onUserSelect?.();
              setBuildAId(e.target.value);
            }}
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
            onChange={(e) => {
              userSelected.current = true;
              onUserSelect?.();
              setBuildBId(e.target.value);
            }}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">The comparison below updates live.</p>
    </Card>
  );
}
