import { useRef, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';
import { Select } from '@/components/ui/Select';

/**
 * One-line build switcher: pick the active system, rename it, delete it, add
 * another. Replaces the 176 px left rail — the section anchors it also carried
 * are gone with the stacked layout, and the systems list is one select instead
 * of a vertical list of buttons.
 */
export function BuildBar() {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const setActiveBuild = useBuildStore((s) => s.setActiveBuild);
  const addBuild = useBuildStore((s) => s.addBuild);
  const renameBuild = useBuildStore((s) => s.renameBuild);
  const removeBuild = useBuildStore((s) => s.removeBuild);

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  // Escape unmounts the input — the blur that follows must not resurrect the
  // cancelled edit.
  const cancelledRef = useRef(false);

  const active = builds.find((b) => b.id === activeBuildId);

  const startRename = () => {
    if (!active) return;
    cancelledRef.current = false;
    setDraft(active.name);
    setRenaming(true);
  };

  const commitRename = () => {
    if (!active) return;
    if (!cancelledRef.current) renameBuild(active.id, draft);
    setRenaming(false);
  };

  const cancelRename = () => {
    cancelledRef.current = true;
    setRenaming(false);
  };

  const iconButton =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-8 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-100';

  if (renaming) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') cancelRename();
          }}
          aria-label="Rename build"
          className="h-8 w-44 rounded-8 border border-brand bg-white px-2 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-gray-50"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Select
        aria-label="Active system"
        className="!h-8 !min-h-8 !w-auto !py-0 !pl-2 !pr-7 !text-sm font-semibold"
        value={activeBuildId ?? ''}
        options={builds.map((b) => ({ value: b.id, label: b.name }))}
        onChange={(e) => setActiveBuild(e.target.value)}
      />
      <button type="button" onClick={startRename} aria-label="Rename system" title="Rename system" className={iconButton}>
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3.5 w-3.5">
          <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.9 8.9-3.536.708.708-3.536 8.9-8.9Z" />
        </svg>
      </button>
      {builds.length > 1 && active && (
        <button
          type="button"
          onClick={() => removeBuild(active.id)}
          aria-label="Delete system"
          title="Delete system"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-8 text-base leading-none text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
        >
          ×
        </button>
      )}
      <button
        type="button"
        onClick={() => addBuild()}
        className="h-8 shrink-0 rounded-8 border border-dashed border-gray-300 px-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-brand-dark hover:text-brand-dark dark:border-gray-600 dark:text-gray-300"
      >
        + System
      </button>
    </div>
  );
}
