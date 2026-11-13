/**
 * FinLens Engine — DPS (Deposit Pension Scheme / Recurring Deposit) Calculator
 *
 * Each monthly installment earns compound interest for its remaining duration.
 * Supports optional annual Step-Up rate (0% to 25%), increasing the monthly installment
 * annually to accelerate compound accumulation.
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
import { detectSplitSavings } from './adjustments';

/**
 * Calculate DPS/RD maturity with monthly progression and optional annual Step-Up.
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
    annualStepUpPercent = new Decimal(0),
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
  if (annualStepUpPercent.isNeg()) {
    throw new Error('Annual step-up percentage cannot be negative');
  }

  const totalMonths = Math.max(1, Math.round(tenureYears * 12));
  const rate = annualRatePct.div(100);
  const taxRate = taxPct.div(100);
  const inflationRate = inflationPct.div(100);
  const stepUpRate = annualStepUpPercent.div(100);
  const hasStepUp = stepUpRate.gt(0);

  const isSimple = compounding === 'simple';
  const n = isSimple ? 0 : compoundingPeriodsPerYear(compounding);
  const ratePerPeriod = n > 0 ? rate.div(n) : new Decimal(0);

  // Precompute installments for each month 1..totalMonths
  // Month i (1-indexed) falls into yearIndex = Math.floor((i - 1) / 12)
  const monthlyInstallments: Decimal[] = [];
  for (let i = 1; i <= totalMonths; i++) {
    const yearIdx = Math.floor((i - 1) / 12);
    if (!hasStepUp || yearIdx === 0) {
      monthlyInstallments.push(monthlyInstallment);
    } else {
      const inst = monthlyInstallment.mul(Decimal.add(1, stepUpRate).pow(yearIdx));
      monthlyInstallments.push(inst);
    }
  }

  const breakdown: DpsPeriodBreakdown[] = [];

  // Monthly progression tracking
  for (let month = 1; month <= totalMonths; month++) {
    let grossBalance = new Decimal(0);
    let flatGrossBalance = new Decimal(0);
    let totalDeposited = new Decimal(0);

    for (let i = 1; i <= month; i++) {
      const inst = monthlyInstallments[i - 1]!;
      totalDeposited = totalDeposited.add(inst);

      const compoundMonths = month - i;
      const compoundYears = new Decimal(compoundMonths).div(12);

      if (isSimple) {
        const factor = Decimal.add(1, rate.mul(compoundYears));
        grossBalance = grossBalance.add(inst.mul(factor));
        if (hasStepUp) {
          flatGrossBalance = flatGrossBalance.add(monthlyInstallment.mul(factor));
        }
      } else {
        const periods = compoundYears.mul(n);
        const factor = Decimal.add(1, ratePerPeriod).pow(periods);
        grossBalance = grossBalance.add(inst.mul(factor));
        if (hasStepUp) {
          flatGrossBalance = flatGrossBalance.add(monthlyInstallment.mul(factor));
        }
      }
    }

    const grossInterest = grossBalance.sub(totalDeposited);
    const cumTax = grossInterest.mul(taxRate);
    const yearsElapsed = Math.ceil(month / 12);
    const cumFees = annualFee.mul(yearsElapsed);
    const netBal = grossBalance.sub(cumTax).sub(cumFees);
    const yearsFrac = new Decimal(month).div(12);
    const realVal = netBal.div(Decimal.add(1, inflationRate).pow(yearsFrac));

    // Flat equivalent net balance for overlay chart
    let flatNetBalance: Decimal | undefined;
    if (hasStepUp) {
      const flatDeposited = monthlyInstallment.mul(month);
      const flatGrossInterest = flatGrossBalance.sub(flatDeposited);
      const flatCumTax = flatGrossInterest.mul(taxRate);
      flatNetBalance = flatGrossBalance.sub(flatCumTax).sub(cumFees);
    }

    breakdown.push({
      month,
      totalDeposited,
      grossInterest,
      grossBalance,
      netBalance: netBal,
      realValue: realVal,
      currentInstallment: monthlyInstallments[month - 1]!,
      flatNetBalance,
    });
  }

  // Final values from the last breakdown entry
  const lastEntry = breakdown[breakdown.length - 1]!;
  const totalDeposited = lastEntry.totalDeposited;
  const grossInterest = lastEntry.grossInterest;
  const totalTax = grossInterest.mul(taxRate);
  const totalFees = annualFee.mul(new Decimal(Math.ceil(totalMonths / 12)));
  const netInterest = grossInterest.sub(totalTax);
  const netMaturity = lastEntry.grossBalance.sub(totalTax).sub(totalFees);
  const tenureDecimal = new Decimal(totalMonths).div(12);
  const realPurchasingPower = netMaturity.div(
    Decimal.add(1, inflationRate).pow(tenureDecimal)
  );

  // Flat comparison metrics if step-up was active
  let flatComparison: DpsResult['flatComparison'];
  if (hasStepUp) {
    const flatDeposited = monthlyInstallment.mul(totalMonths);
    const flatLastNet = lastEntry.flatNetBalance ?? flatDeposited;
    const flatNetInterest = flatLastNet.sub(flatDeposited);
    flatComparison = {
      totalDeposited: flatDeposited,
      netMaturity: flatLastNet,
      netInterest: flatNetInterest,
      extraMaturityEarned: netMaturity.sub(flatLastNet),
    };
  }

  // Smart split optimizer for BD excise duty
  const splitSavingsTip = detectSplitSavings(lastEntry.grossBalance, tenureYears);

  return {
    totalDeposited,
    grossInterest,
    totalTax,
    totalFees,
    netInterest,
    netMaturity,
    realPurchasingPower,
    breakdown,
    flatComparison,
    splitSavingsTip,
  };
}
