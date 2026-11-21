import { useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

/**
 * The way out of a standalone form page. Going back is the natural action when
 * the visitor arrived from the calculator or a content page; a direct visit has
 * no in-app history, so it falls back to the calculator instead of leaving the
 * site.
 */
export function CloseButton({ fallback = '/' }: { fallback?: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  const close = () => {
    if (location.key === 'default') navigate(fallback);
    else navigate(-1);
  };

  return (
    <button
      type="button"
      onClick={close}
      aria-label="Close"
      title="Close"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-8 border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-50"
    >
      <X aria-hidden className="h-4 w-4" />
      Close
    </button>
  );
}
