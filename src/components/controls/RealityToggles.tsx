import { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Shield, Receipt, TrendingDown, FileText, Landmark } from 'lucide-react';
import { DualSliderInput } from './DualSliderInput';
import { calculateBdExciseDuty } from '@/engine/adjustments';
import { cn } from '@/lib/utils';

interface RealityTogglesProps {
  taxPct: number;
  onTaxPctChange: (v: number) => void;
  annualFee: number;
  onAnnualFeeChange: (v: number) => void;
  inflationPct: number;
  onInflationPctChange: (v: number) => void;
  currentBalance?: number;
  className?: string;
  /** Whether to show the annual fee slider (not applicable for EMI) */
  showFee?: boolean;
}

/**
 * RealityToggles — Grouped adjustment controls for Tax (with TIN toggle),
 * Auto BD Excise Duty (FY 2026-27), and Inflation.
 */
export function RealityToggles({
  taxPct,
  onTaxPctChange,
  annualFee,
  onAnnualFeeChange,
  inflationPct,
  onInflationPctChange,
  currentBalance,
  className,
  showFee = true,
}: RealityTogglesProps) {
  const [exciseMode, setExciseMode] = useState<'auto' | 'manual'>('auto');

  // Auto-calculated BD excise duty
  const calculatedDuty = currentBalance !== undefined && currentBalance > 0
    ? calculateBdExciseDuty(new Decimal(currentBalance)).toNumber()
    : calculateBdExciseDuty(new Decimal(annualFee)).toNumber();

  useEffect(() => {
    if (exciseMode === 'auto' && showFee) {
      onAnnualFeeChange(calculatedDuty);
    }
  }, [exciseMode, calculatedDuty, showFee]);

  const getExciseSlabLabel = (bal: number) => {
    if (bal <= 400000) return 'Up to ৳4L (৳0)';
    if (bal <= 500000) return '৳4L–৳5L (৳150)';
    if (bal <= 1000000) return '৳5L–৳10L (৳500)';
    if (bal <= 5000000) return '৳10L–৳50L (৳3,000)';
    if (bal <= 10000000) return '৳50L–৳1Cr (৳5,000)';
    return 'Above ৳1Cr (৳10,000)';
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-border/80 bg-muted/30 p-5 space-y-5',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>Reality Deductions & Tax</span>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          NBR Slabs Active
        </span>
      </div>

      {/* Tax Section with TIN / PSR Quick Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            TIN / PSR Status:
          </span>
          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => onTaxPctChange(10)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                taxPct === 10
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              With TIN (10%)
            </button>
            <button
              type="button"
              onClick={() => onTaxPctChange(15)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                taxPct === 15
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Without TIN (15%)
            </button>
          </div>
        </div>

        <DualSliderInput
          id="tax-pct"
          label="Source Tax / AIT"
          value={taxPct}
          onChange={onTaxPctChange}
          min={0}
          max={30}
          step={0.5}
          unit="%"
          decimals={1}
        />
      </div>

      {/* Annual Excise Duty Mode */}
      {showFee && (
        <div className="space-y-2 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5 text-primary" />
              Excise Duty Mode:
            </span>
            <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setExciseMode('auto');
                  onAnnualFeeChange(calculatedDuty);
                }}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  exciseMode === 'auto'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Auto BD (FY 26-27)
              </button>
              <button
                type="button"
                onClick={() => setExciseMode('manual')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  exciseMode === 'manual'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Manual Fee
              </button>
            </div>
          </div>

          {exciseMode === 'auto' ? (
            <div className="p-3 rounded-xl bg-card border border-border/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-foreground block">Auto Tiered BD Excise Duty</span>
                <span className="text-[11px] text-muted-foreground">
                  Tier: {currentBalance ? getExciseSlabLabel(currentBalance) : 'Based on Peak Balance'}
                </span>
              </div>
              <span className="font-mono font-extrabold text-sm text-primary">
                ৳{calculatedDuty.toLocaleString()}/yr
              </span>
            </div>
          ) : (
            <DualSliderInput
              id="annual-fee"
              label="Annual Excise / Fee"
              value={annualFee}
              onChange={onAnnualFeeChange}
              min={0}
              max={15000}
              step={50}
              prefix="৳"
            />
          )}
        </div>
      )}

      {/* Inflation Adjustment */}
      <div className="pt-1 border-t border-border/40">
        <DualSliderInput
          id="inflation-pct"
          label="Expected Inflation"
          value={inflationPct}
          onChange={onInflationPctChange}
          min={0}
          max={20}
          step={0.5}
          unit="%"
          decimals={1}
        />
      </div>

      <div className="flex gap-4 pt-1 border-t border-border/30 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-primary" />
          <span>AIT on gross interest</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
          <span>Inflation purchasing discount</span>
        </div>
      </div>
    </div>
  );
}
