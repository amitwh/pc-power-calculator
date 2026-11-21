import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-12 p-4 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Card heading. Its default size lives in the components layer (`card-title`)
 * rather than as a `text-xl` utility so a caller's `className="text-base"`
 * actually wins — utility order, not class-string order, decides the cascade.
 */
export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`card-title font-display font-bold mb-2 flex items-center justify-between gap-2 ${className}`}>
      {children}
    </h2>
  );
}
