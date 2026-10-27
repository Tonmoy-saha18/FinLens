import React, { useCallback } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface DualSliderInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}

/**
 * DualSliderInput — A combined slider + numeric input that fires on every change.
 * Core building block for the zero-"Calculate"-button UX.
 */
export function DualSliderInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit = '',
  prefix = '',
  decimals = 0,
  className,
}: DualSliderInputProps) {
  const handleSliderChange = useCallback(
    (vals: number[]) => {
      const v = vals[0];
      if (v !== undefined) onChange(v);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '' || raw === '-') return;
      let parsed = parseFloat(raw);
      if (isNaN(parsed)) return;
      parsed = Math.max(min, Math.min(max, parsed));
      onChange(parsed);
    },
    [onChange, min, max]
  );

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (isNaN(parsed)) {
        onChange(min);
      } else {
        onChange(Math.max(min, Math.min(max, parsed)));
      }
    },
    [onChange, min, max]
  );

  // Calculate fill percentage for gradient track
  const fillPct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground/80">
          {label}
        </label>
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-2 text-sm text-muted-foreground font-medium pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            id={id}
            type="number"
            value={decimals > 0 ? value.toFixed(decimals) : value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className={cn(
              'w-28 h-8 rounded-md border border-input bg-background text-right text-sm font-mono font-medium tabular-nums shadow-sm transition-all input-glow focus:outline-none',
              prefix ? 'pl-6 pr-2' : 'px-2'
            )}
          />
          {unit && (
            <span className="ml-1.5 text-xs text-muted-foreground font-medium min-w-[24px]">
              {unit}
            </span>
          )}
        </div>
      </div>

      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center h-5 group"
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <SliderPrimitive.Range
            className="absolute h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
            style={{ width: `${fillPct}%` }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:scale-110 hover:shadow-lg active:scale-95 cursor-grab active:cursor-grabbing" />
      </SliderPrimitive.Root>

      <div className="flex justify-between text-[10px] text-muted-foreground/60 font-mono">
        <span>{prefix}{min.toLocaleString()}</span>
        <span>{prefix}{max.toLocaleString()}</span>
      </div>
    </div>
  );
}
