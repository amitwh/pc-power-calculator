import { useRef, useState } from 'react';
import { useBuildStore } from '@/store/buildStore';

/** In-page anchors to the four work-area cards. */
const SECTIONS = [
  { href: '#system', label: 'Your system' },
  { href: '#usage', label: 'Usage' },
  { href: '#tariff', label: 'Tariff' },
  { href: '#analysis', label: 'Analysis' },
];

/**
 * Left rail of the calculator workbench: section anchors plus the build
 * switcher. Hidden below 1100px, where the page is a single column.
 */
export function SectionRail() {
  const builds = useBuildStore((s) => s.builds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const setActiveBuild = useBuildStore((s) => s.setActiveBuild);
  const addBuild = useBuildStore((s) => s.addBuild);
  const renameBuild = useBuildStore((s) => s.renameBuild);
  const removeBuild = useBuildStore((s) => s.removeBuild);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  // Escape unmounts the input — a trailing blur must not resurrect the edit.
  const cancelledRef = useRef(false);

  const startRename = (id: string, current: string) => {
    cancelledRef.current = false;
    setRenamingId(id);
    setRenameDraft(current);
  };

  const commitRename = () => {
    if (!renamingId) return;
    if (!cancelledRef.current) renameBuild(renamingId, renameDraft);
    setRenamingId(null);
  };

  const cancelRename = () => {
    cancelledRef.current = true;
    setRenamingId(null);
  };

  return (
    <nav
      aria-label="Sections"
      className="hidden self-start sticky top-5 min-[1100px]:block"
    >
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1.5 px-2">
        Sections
      </div>
      <ul className="space-y-0.5">
        {SECTIONS.map((section) => (
          <li key={section.href}>
            <a
              href={section.href}
              className="block rounded-8 px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-dark transition-colors"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-6 text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1.5 px-2">
        Systems
      </div>
      <ul className="space-y-0.5">
        {builds.map((build) => {
          const isActive = build.id === activeBuildId;
          const isRenaming = renamingId === build.id;
          return (
            <li key={build.id} className="group/row flex items-center gap-0.5">
              {isRenaming ? (
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') cancelRename();
                  }}
                  aria-label="Rename build"
                  className="min-w-0 flex-1 rounded-8 border border-brand bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-50 outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveBuild(build.id)}
                  onDoubleClick={() => startRename(build.id, build.name)}
                  aria-current={isActive ? 'true' : undefined}
                  title="Click to switch; double-click to rename"
                  className={`min-w-0 flex-1 truncate text-left rounded-8 border-l-2 px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'border-brand bg-brand/5 text-gray-900 dark:text-gray-50 font-semibold'
                      : 'border-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {build.name}
                </button>
              )}
              {!isRenaming && (
                <button
                  type="button"
                  onClick={() => startRename(build.id, build.name)}
                  aria-label={`Rename ${build.name}`}
                  title="Rename"
                  className="shrink-0 inline-flex min-h-9 min-w-9 items-center justify-center rounded-8 text-gray-400 opacity-0 transition-opacity hover:text-gray-700 focus-visible:opacity-100 group-hover/row:opacity-100 dark:hover:text-gray-200"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3.5 w-3.5">
                    <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-8.9 8.9-3.536.708.708-3.536 8.9-8.9Z" />
                  </svg>
                </button>
              )}
              {!isRenaming && builds.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBuild(build.id)}
                  aria-label={`Delete ${build.name}`}
                  title="Delete"
                  className="shrink-0 inline-flex min-h-9 min-w-9 items-center justify-center rounded-8 text-base leading-none text-gray-400 opacity-0 transition-opacity hover:text-red-600 focus-visible:opacity-100 group-hover/row:opacity-100 dark:hover:text-red-400"
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => addBuild()}
        className="mt-2 w-full text-left rounded-8 px-2 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-dashed border-gray-400 dark:border-gray-600 hover:border-brand-dark hover:text-brand-dark transition-colors"
      >
        + New system
      </button>
    </nav>
  );
}
