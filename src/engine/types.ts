/**
 * FinLens Engine — Shared Type Definitions
 *
 * All monetary values within the engine are `Decimal` instances.
 * Conversion to display-ready `number` or `string` happens ONLY at the UI boundary.
 */
import Decimal from 'decimal.js';

// ─── Compounding ────────────────────────────────────────────────

export type CompoundingFrequency = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'simple';

/** Maps a CompoundingFrequency to the number of compounding periods per year. */
export function compoundingPeriodsPerYear(freq: CompoundingFrequency): number {
  switch (freq) {
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'half-yearly':
      return 2;
    case 'yearly':
      return 1;
    case 'simple':
      return 0; // sentinel — handled separately
  }
}

// ─── FDR Types ──────────────────────────────────────────────────

export interface FdrInput {
  /** Initial deposit amount */
  principal: Decimal;
  /** Annual interest rate as a percentage (e.g. 7.5 for 7.5%) */
  annualRatePct: Decimal;
  /** Tenure in months */
  tenureMonths: number;
  /** How often interest is compounded */
  compounding: CompoundingFrequency;
  /** Source Tax / AIT on interest as a percentage (e.g. 10 for 10%) */
  taxPct: Decimal;
  /** Annual excise duty / maintenance fee (flat amount per year) */
  annualFee: Decimal;
  /** Expected annual inflation rate as a percentage */
  inflationPct: Decimal;
}

export interface FdrPeriodBreakdown {
  /** 1-indexed period number */
  period: number;
  /** Label for the period (e.g. "Month 3", "Quarter 2", "Year 1") */
  label: string;
  /** Gross balance at the end of this period (before any deductions) */
  grossBalance: Decimal;
  /** Cumulative interest earned up to this period */
  cumulativeInterest: Decimal;
  /** Cumulative tax deducted up to this period */
  cumulativeTax: Decimal;
  /** Cumulative fees deducted up to this period */
  cumulativeFees: Decimal;
  /** Net balance after tax & fees */
  netBalance: Decimal;
  /** Inflation-adjusted (real) value of the net balance */
  realValue: Decimal;
}

export interface FdrResult {
  principal: Decimal;
  grossMaturity: Decimal;
  grossInterest: Decimal;
  totalTax: Decimal;
  totalFees: Decimal;
  netMaturity: Decimal;
  /** Net effective yield as annual percentage */
  netEffectiveYieldPct: Decimal;
  /** Real purchasing power of net maturity, discounted by inflation */
  realPurchasingPower: Decimal;
  /** Period-by-period breakdown */
  breakdown: FdrPeriodBreakdown[];
}

// ─── DPS / Recurring Deposit Types ─────────────────────────────

export interface DpsInput {
  /** Fixed monthly installment amount */
  monthlyInstallment: Decimal;
  /** Annual interest rate as a percentage */
  annualRatePct: Decimal;
  /** Tenure in years */
  tenureYears: number;
  /** Compounding frequency (typically monthly or quarterly for DPS) */
  compounding: CompoundingFrequency;
  /** Source Tax / AIT on interest as a percentage */
  taxPct: Decimal;
  /** Annual excise / maintenance fee */
  annualFee: Decimal;
  /** Expected annual inflation rate as a percentage */
  inflationPct: Decimal;
}

export interface DpsPeriodBreakdown {
  /** 1-indexed month number */
  month: number;
  /** Total principal deposited so far */
  totalDeposited: Decimal;
  /** Gross interest earned up to this month */
  grossInterest: Decimal;
  /** Gross balance (principal + interest) */
  grossBalance: Decimal;
  /** Net balance after tax & fees */
  netBalance: Decimal;
  /** Inflation-adjusted real value */
  realValue: Decimal;
}

export interface DpsResult {
  totalDeposited: Decimal;
  grossInterest: Decimal;
  totalTax: Decimal;
  totalFees: Decimal;
  netInterest: Decimal;
  netMaturity: Decimal;
  /** Real purchasing power of net maturity */
  realPurchasingPower: Decimal;
  /** Monthly progression array */
  breakdown: DpsPeriodBreakdown[];
}

// ─── EMI / Loan Amortization Types ─────────────────────────────

export interface EmiInput {
  /** Loan principal amount */
  loanPrincipal: Decimal;
  /** Annual interest rate as a percentage */
  annualRatePct: Decimal;
  /** Loan tenure in months */
  tenureMonths: number;
  /** Optional extra monthly prepayment */
  extraMonthlyPrepayment: Decimal;
  /** Optional yearly lump-sum prepayment (applied at end of each year) */
  yearlyLumpSumPrepayment: Decimal;
}

export interface EmiAmortizationRow {
  /** 1-indexed month number */
  month: number;
  /** EMI payment for this month */
  emi: Decimal;
  /** Principal portion of the EMI */
  principalPortion: Decimal;
  /** Interest portion of the EMI */
  interestPortion: Decimal;
  /** Extra prepayment applied this month */
  prepayment: Decimal;
  /** Outstanding balance after this month's payment */
  outstandingBalance: Decimal;
  /** Cumulative interest paid up to this month */
  cumulativeInterest: Decimal;
  /** Cumulative principal paid up to this month */
  cumulativePrincipal: Decimal;
}

export interface EmiResult {
  /** Base monthly EMI (without prepayments) */
  baseEmi: Decimal;
  /** Total interest payable without any prepayments */
  totalInterestWithoutPrepayment: Decimal;
  /** Total interest payable with prepayments */
  totalInterestWithPrepayment: Decimal;
  /** Interest saved by making prepayments */
  interestSaved: Decimal;
  /** Original tenure in months */
  originalTenureMonths: number;
  /** Actual tenure with prepayments (number of months until fully paid) */
  actualTenureMonths: number;
  /** Months shaved off */
  monthsSaved: number;
  /** Full monthly amortization schedule */
  schedule: EmiAmortizationRow[];
}
