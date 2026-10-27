import { Shield, Receipt, TrendingDown } from 'lucide-react';
import { DualSliderInput } from './DualSliderInput';
import { cn } from '@/lib/utils';

interface RealityTogglesProps {
  taxPct: number;
  onTaxPctChange: (v: number) => void;
  annualFee: number;
  onAnnualFeeChange: (v: number) => void;
  inflationPct: number;
  onInflationPctChange: (v: number) => void;
  className?: string;
  /** Whether to show the annual fee slider (not applicable for EMI) */
  showFee?: boolean;
}

/**
 * RealityToggles — Grouped adjustment sliders for Tax, Fees, and Inflation.
 * These let users see the "real" return after deductions.
 */
export function RealityToggles({
  taxPct,
  onTaxPctChange,
  annualFee,
  onAnnualFeeChange,
  inflationPct,
  onInflationPctChange,
  className,
  showFee = true,
}: RealityTogglesProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border/70 bg-muted/30 p-4 space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Shield className="h-4 w-4 text-chart-4" />
        <span>Reality Adjustments</span>
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

      {showFee && (
        <DualSliderInput
          id="annual-fee"
          label="Annual Excise / Fee"
          value={annualFee}
          onChange={onAnnualFeeChange}
          min={0}
          max={5000}
          step={50}
          prefix="৳"
        />
      )}

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

      <div className="flex gap-3 pt-1">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Receipt className="h-3 w-3" />
          <span>Tax on interest</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <TrendingDown className="h-3 w-3" />
          <span>Purchasing power</span>
        </div>
      </div>
    </div>
  );
}
