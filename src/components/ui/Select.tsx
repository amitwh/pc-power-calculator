import type { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
}

/* `min-w-0 max-w-full` on the control: a native <select> takes its min-content
   width from its longest option, which pushed a two-column form past the phone
   viewport (388 px card inside a 390 px page). */
export function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`w-full min-w-0 max-w-full min-h-[44px] px-3 rounded-8 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 font-body ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
