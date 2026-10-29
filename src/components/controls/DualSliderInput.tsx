import React, { useState, useEffect, useCallback, useId } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export interface UnitToggleConfig {
  current: string;
  options: string[];
  onToggle: (unit: string) => void;
}

interface DualSliderInputProps {
  id?: string;
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
  unitToggle?: UnitToggleConfig;
  hint?: string;
}

/**
 * Parse flexible input strings supporting:
 * - Direct numbers: 150000, 150000.5
 * - Commas: 1,50,000 or 150,000
 * - Suffixes:
 *   - k / K / thousand: * 1,000
 *   - l / L / lac / lakh: * 100,000
 *   - cr / Cr / crore: * 10,000,000
 *   - m / M / million: * 1,000,000
 *   - b / B / billion: * 1,000,000,000
 */
export function parseFlexibleNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/,/g, '');
  if (!cleaned) return null;

  // Crores
  const crMatch = cleaned.match(/^([0-9.]+)\s*(cr|crore|crores)$/i);
  if (crMatch && crMatch[1]) {
    const val = parseFloat(crMatch[1]);
    return isNaN(val) ? null : val * 1e7;
  }

  // Lakhs
  const lMatch = cleaned.match(/^([0-9.]+)\s*(l|lac|lacs|lakh|lakhs)$/i);
  if (lMatch && lMatch[1]) {
    const val = parseFloat(lMatch[1]);
    return isNaN(val) ? null : val * 1e5;
  }

  // Millions
  const mMatch = cleaned.match(/^([0-9.]+)\s*(m|mn|million)$/i);
  if (mMatch && mMatch[1]) {
    const val = parseFloat(mMatch[1]);
    return isNaN(val) ? null : val * 1e6;
  }

  // Billions
  const bMatch = cleaned.match(/^([0-9.]+)\s*(b|bn|billion)$/i);
  if (bMatch && bMatch[1]) {
    const val = parseFloat(bMatch[1]);
    return isNaN(val) ? null : val * 1e9;
  }

  // Thousands
  const kMatch = cleaned.match(/^([0-9.]+)\s*(k|thousand)$/i);
  if (kMatch && kMatch[1]) {
    const val = parseFloat(kMatch[1]);
    return isNaN(val) ? null : val * 1e3;
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Format a number cleanly for display inside the input
 */
function formatDisplayNumber(val: number, decimals: number): string {
  if (decimals > 0) {
    return val.toFixed(decimals);
  }
  return val.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * DualSliderInput — Highly flexible dual control (draggable slider + unconstrained direct input).
 * Accepts any number, comma-separated notation, and shorthand suffixes (k, L, Cr, M).
 */
export function DualSliderInput({
  id: propId,
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
  unitToggle,
  hint,
}: DualSliderInputProps) {
  const generatedId = useId();
  const inputId = propId || generatedId;

  // Track user input text locally so typing is smooth and never jumps or gets blocked
  const [inputText, setInputText] = useState<string>(() => formatDisplayNumber(value, decimals));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  // Sync from external value changes (e.g. slider drag, presets) when not actively typing
  useEffect(() => {
    if (!isFocused) {
      setInputText(formatDisplayNumber(value, decimals));
    }
  }, [value, decimals, isFocused]);

  // Dynamic slider range that adapts if the user enters a number beyond default bounds
  const effectiveMin = Math.min(min, Math.max(0, value));
  const effectiveMax = Math.max(max, value);

  // Slider change handler
  const handleSliderChange = useCallback(
    (vals: number[]) => {
      const v = vals[0];
      if (v !== undefined) {
        onChange(v);
        setInputText(formatDisplayNumber(v, decimals));
      }
    },
    [onChange, decimals]
  );

  // Input change handler (flexible, unconstrained typing)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputText(raw);

    // Try parsing flexible input
    const parsed = parseFlexibleNumber(raw);
    if (parsed !== null && parsed >= 0) {
      onChange(parsed);
    }
  };

  // On blur, clean up formatting and ensure fallback
  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseFlexibleNumber(inputText);
    if (parsed === null || isNaN(parsed) || parsed < 0) {
      // Revert to current valid value or minimum
      const fallback = Math.max(0, min);
      onChange(fallback);
      setInputText(formatDisplayNumber(fallback, decimals));
    } else {
      onChange(parsed);
      setInputText(formatDisplayNumber(parsed, decimals));
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Strip commas on focus for easy numeric editing
    setInputText(value ? (decimals > 0 ? value.toFixed(decimals) : value.toString()) : '');
  };

  // Calculate fill percentage for gradient track
  const rangeSpan = effectiveMax - effectiveMin;
  const fillPct = rangeSpan > 0 ? Math.min(100, Math.max(0, ((value - effectiveMin) / rangeSpan) * 100)) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Input Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor={inputId} className="text-sm font-medium text-foreground/80 cursor-pointer">
            {label}
          </label>
          {unitToggle && (
            <div className="flex items-center p-0.5 rounded-md bg-muted/80 border border-border/60 text-[10px] font-semibold">
              {unitToggle.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => unitToggle.onToggle(opt)}
                  className={cn(
                    'px-1.5 py-0.5 rounded transition-all capitalize',
                    unitToggle.current.toLowerCase() === opt.toLowerCase()
                      ? 'bg-background text-foreground shadow-xs font-bold text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Flexible Numeric Input Box */}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-2.5 text-xs text-muted-foreground font-semibold pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck="false"
            value={inputText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={min.toString()}
            className={cn(
              'w-32 sm:w-36 h-8 rounded-lg border border-input bg-background text-right text-xs sm:text-sm font-mono font-semibold tabular-nums shadow-xs transition-all input-glow focus:outline-none focus:ring-2 focus:ring-primary/20',
              prefix ? 'pl-6 pr-2.5' : 'px-2.5'
            )}
            title="Type any number or shorthand (e.g. 50k, 2.5L, 1.5Cr, 10M)"
          />
          {unit && (
            <span className="ml-1.5 text-xs text-muted-foreground font-medium min-w-[20px] select-none">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Draggable Slider */}
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center h-5 group"
        value={[Math.min(effectiveMax, Math.max(effectiveMin, value))]}
        onValueChange={handleSliderChange}
        min={effectiveMin}
        max={effectiveMax}
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

      {/* Min / Max and Hint info */}
      <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 font-mono">
        <span>{prefix}{effectiveMin.toLocaleString()}</span>
        {hint ? (
          <span className="text-[9px] text-muted-foreground/50 tracking-tight font-sans italic hidden sm:inline">
            {hint}
          </span>
        ) : (
          <span className="text-[9px] text-muted-foreground/40 font-sans hidden sm:inline">
            Supports k, L, Cr, M
          </span>
        )}
        <span>{prefix}{effectiveMax.toLocaleString()}</span>
      </div>
    </div>
  );
}
