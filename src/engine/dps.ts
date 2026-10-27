/**
 * FinLens Engine — DPS (Deposit Pension Scheme / Recurring Deposit) Calculator
 *
 * Each monthly installment earns compound interest for its remaining duration.
 * Interest is compounded per the chosen frequency, tax applied on total interest,
 * and fees deducted per year.
 *
 * ALL arithmetic uses decimal.js — no native float math.
 */
import Decimal from 'decimal.js';
import {
  type DpsInput,
  type DpsResult,
  type DpsPeriodBreakdown,
  compoundingPeriodsPerYear,
} from './types';

/**
 * Calculate DPS/RD maturity with monthly progression.
 *
 * For each monthly installment deposited at the start of month `m`,
 * the remaining months are `totalMonths - m + 1` (if deposited at start).
 * We treat deposits as end-of-month for a conservative estimate,
 * so installment `m` compounds for `(totalMonths - m)` months.
 *
 * With compounding frequency `n` times per year:
 *   FV_m = installment × (1 + r/n)^(n × remainingMonths/12)
 *
 * For simple interest:
 *   FV_m = installment × (1 + r × remainingMonths/12)
 */
export function calculateDps(input: DpsInput): DpsResult {
  const {
    monthlyInstallment,
    annualRatePct,
    tenureYears,
    compounding,
    taxPct,
    annualFee,
    inflationPct,
  } = input;

  // Validate
  if (monthlyInstallment.isNeg() || monthlyInstallment.isZero()) {
    throw new Error('Monthly installment must be positive');
  }
  if (tenureYears <= 0) {
    throw new Error('Tenure must be positive');
  }
  if (annualRatePct.isNeg()) {
    throw new Error('Interest rate cannot be negative');
  }
  if (taxPct.isNeg() || taxPct.gte(100)) {
    throw new Error('Tax percentage must be >= 0 and < 100');
  }

  const totalMonths = tenureYears * 12;
  const rate = annualRatePct.div(100);
  const taxRate = taxPct.div(100);
  const inflationRate = inflationPct.div(100);
  const isSimple = compounding === 'simple';
  const n = isSimple ? 0 : compoundingPeriodsPerYear(compounding);

  const breakdown: DpsPeriodBreakdown[] = [];

  // Accumulate: for each month, sum the future value of all installments deposited so far
  for (let month = 1; month <= totalMonths; month++) {
    let grossBalance = new Decimal(0);

    // Sum FV of each installment deposited in months 1..month,
    // compounded for the time remaining until this snapshot month.
    // At month `month`, installment deposited at month `i` has been
    // compounding for `(month - i)` months.
    for (let i = 1; i <= month; i++) {
      const compoundMonths = month - i; // months this installment has compounded
      const compoundYears = new Decimal(compoundMonths).div(12);

      if (isSimple) {
        // Simple: FV = P × (1 + r × t)
        grossBalance = grossBalance.add(
          monthlyInstallment.mul(Decimal.add(1, rate.mul(compoundYears)))
        );
      } else {
        // Compound: FV = P × (1 + r/n)^(n × t)
        const ratePerPeriod = rate.div(n);
        const periods = compoundYears.mul(n);
        grossBalance = grossBalance.add(
          monthlyInstallment.mul(
            Decimal.add(1, ratePerPeriod).pow(periods)
          )
        );
      }
    }

    const totalDeposited = monthlyInstallment.mul(month);
    const grossInterest = grossBalance.sub(totalDeposited);
    const cumTax = grossInterest.mul(taxRate);
    const yearsElapsed = Math.ceil(month / 12);
    const cumFees = annualFee.mul(yearsElapsed);
    const netBal = grossBalance.sub(cumTax).sub(cumFees);
    const yearsFrac = new Decimal(month).div(12);
    const realVal = netBal.div(
      Decimal.add(1, inflationRate).pow(yearsFrac)
    );

    breakdown.push({
      month,
      totalDeposited,
      grossInterest,
      grossBalance,
      netBalance: netBal,
      realValue: realVal,
    });
  }

  // Final values from the last breakdown entry
  const lastEntry = breakdown[breakdown.length - 1]!;
  const totalDeposited = lastEntry.totalDeposited;
  const grossInterest = lastEntry.grossInterest;
  const totalTax = grossInterest.mul(taxRate);
  const totalFees = annualFee.mul(tenureYears);
  const netInterest = grossInterest.sub(totalTax);
  const netMaturity = lastEntry.grossBalance.sub(totalTax).sub(totalFees);
  const tenureDecimal = new Decimal(tenureYears);
  const realPurchasingPower = netMaturity.div(
    Decimal.add(1, inflationRate).pow(tenureDecimal)
  );

  return {
    totalDeposited,
    grossInterest,
    totalTax,
    totalFees,
    netInterest,
    netMaturity,
    realPurchasingPower,
    breakdown,
  };
}
