import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface DeferInViewProps {
  children: ReactNode;
  /** Rendered until the section comes near the viewport (reserves space). */
  placeholder?: ReactNode;
  className?: string;
}

/**
 * Renders children only once the placeholder scrolls within 200px of the
 * viewport. Used for below-the-fold charts: React.lazy code-splits the heavy
 * chart bundle, but the component still mounts on first render — this defers
 * the ~900 KB chart chunk until a visitor actually scrolls near the chart,
 * which on mobile is most visits.
 */
export function DeferInView({ children, placeholder, className }: DeferInViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    // No IntersectionObserver (very old browsers): render immediately.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : (placeholder ?? <div className="h-[260px]" aria-hidden />)}
    </div>
  );
}
