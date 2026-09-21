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

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-xl font-bold mb-2 flex items-center justify-between gap-2 ${className}`}>
      {children}
    </h2>
  );
}
