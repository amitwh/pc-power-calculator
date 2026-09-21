import type { Component } from '@/types/component';
import { Button } from '@/components/ui/Button';

interface Props {
  categoryLabel: string;
  component: Component | null;
  /** Override wattage to display in lieu of the component's own `tdp_w`. */
  tdpOverrideW?: number | null;
  onClear?: () => void;
  onOverride?: () => void;
}

export function ComponentCard({ categoryLabel, component, tdpOverrideW, onClear, onOverride }: Props) {
  const effectiveW = tdpOverrideW ?? component?.tdp_w ?? null;
  const overridden = tdpOverrideW != null && component?.tdp_w != null && tdpOverrideW !== component.tdp_w;
  return (
    <div className="flex items-center justify-between border border-gray-200 dark:border-gray-800 rounded-8 p-3">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-gray-500">{categoryLabel}</div>
        {component ? (
          <div className="font-body">
            <span className="font-semibold">
              {component.brand} {component.model}
            </span>
            {effectiveW != null && (
              <span
                className={`ml-2 text-sm tabular-nums ${overridden ? 'text-warning font-semibold' : 'text-gray-500'}`}
                title={overridden ? `Spec TDP: ${component.tdp_w} W (overridden)` : undefined}
              >
                {effectiveW} W
              </span>
            )}
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400">Not selected</div>
        )}
      </div>
      {component && (
        <div className="flex gap-1 shrink-0">
          {onOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOverride}
              aria-label={`Override TDP for ${categoryLabel}`}
              title="Override TDP"
            >
              ✎
            </Button>
          )}
          {onClear && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClear}
              aria-label={`Remove ${categoryLabel}`}
              title="Remove"
            >
              ×
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
