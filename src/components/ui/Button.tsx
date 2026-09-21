import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const styles: Record<Variant, string> = {
  primary: 'bg-brand-dark text-white hover:bg-brand',
  secondary:
    'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 hover:bg-gray-200 dark:hover:bg-gray-700',
  danger: 'bg-danger text-white hover:opacity-90',
  ghost:
    'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}
export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const sizing = size === 'sm' ? 'min-h-[36px] px-3 text-sm' : 'min-h-[44px] px-4';
  return (
    <button
      {...props}
      className={`${sizing} rounded-8 font-body font-semibold transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    />
  );
}
