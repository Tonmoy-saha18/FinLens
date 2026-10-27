/**
 * FinLens Engine — EMI & Prepayment Optimizer
 *
 * Standard reducing-balance EMI with optional monthly and yearly lump-sum
 * prepayments. Generates a full amortization schedule showing how prepayments
 * reduce total interest and tenure.
 *
 * EMI Formula:  EMI = P × r × (1+r)^n / ((1+r)^n - 1)
 * where P = principal, r = monthly rate, n = total months
 *
 * ALL arithmetic uses decimal.js — no native float math.
 */
import Decimal from 'decimal.js';
import {
  type EmiInput,
  type EmiResult,
  type EmiAmortizationRow,
} from './types';

/**
 * Calculate standard reducing-balance EMI.
 */
function computeBaseEmi(
  principal: Decimal,
  monthlyRate: Decimal,
  tenureMonths: number
): Decimal {
  if (monthlyRate.isZero()) {
    // 0% interest — simple division
    return principal.div(tenureMonths);
  }

  // EMI = P × r × (1+r)^n / ((1+r)^n - 1)
  const onePlusR = Decimal.add(1, monthlyRate);
  const onePlusRPowN = onePlusR.pow(tenureMonths);
  return principal
    .mul(monthlyRate)
    .mul(onePlusRPowN)
    .div(onePlusRPowN.sub(1));
}

/**
 * Generate a full amortization schedule WITHOUT any prepayments.
 * Used to calculate the baseline total interest.
 */
function baselineSchedule(
  principal: Decimal,
  monthlyRate: Decimal,
  tenureMonths: number,
  emi: Decimal
): { totalInterest: Decimal; schedule: EmiAmortizationRow[] } {
  const schedule: EmiAmortizationRow[] = [];
  let outstanding = principal;
  let cumulativeInterest = new Decimal(0);
  let cumulativePrincipal = new Decimal(0);

  for (let m = 1; m <= tenureMonths; m++) {
    const interestPortion = outstanding.mul(monthlyRate);
    let principalPortion = emi.sub(interestPortion);

    // Last month adjustment — clamp to outstanding balance
    if (principalPortion.gt(outstanding)) {
      principalPortion = outstanding;
    }

    outstanding = outstanding.sub(principalPortion);
    cumulativeInterest = cumulativeInterest.add(interestPortion);
    cumulativePrincipal = cumulativePrincipal.add(principalPortion);

    // Guard against tiny negative from rounding
    if (outstanding.isNeg()) {
      outstanding = new Decimal(0);
    }

    schedule.push({
      month: m,
      emi,
      principalPortion,
      interestPortion,
      prepayment: new Decimal(0),
      outstandingBalance: outstanding,
      cumulativeInterest,
      cumulativePrincipal,
    });

    if (outstanding.isZero()) break;
  }

  return { totalInterest: cumulativeInterest, schedule };
}

/**
 * Calculate EMI with optional prepayments.
 */
export function calculateEmi(input: EmiInput): EmiResult {
  const {
    loanPrincipal,
    annualRatePct,
    tenureMonths,
    extraMonthlyPrepayment,
    yearlyLumpSumPrepayment,
  } = input;

  // Validate
  if (loanPrincipal.isNeg() || loanPrincipal.isZero()) {
    throw new Error('Loan principal must be positive');
  }
  if (tenureMonths <= 0) {
    throw new Error('Tenure must be positive');
  }
  if (annualRatePct.isNeg()) {
    throw new Error('Interest rate cannot be negative');
  }
  if (extraMonthlyPrepayment.isNeg()) {
    throw new Error('Extra monthly prepayment cannot be negative');
  }
  if (yearlyLumpSumPrepayment.isNeg()) {
    throw new Error('Yearly lump-sum prepayment cannot be negative');
  }

  const monthlyRate = annualRatePct.div(100).div(12);

  // Base EMI (before prepayments)
  const baseEmi = computeBaseEmi(loanPrincipal, monthlyRate, tenureMonths);

  // Baseline total interest (no prepayments)
  const baseline = baselineSchedule(
    loanPrincipal,
    monthlyRate,
    tenureMonths,
    baseEmi
  );
  const totalInterestWithoutPrepayment = baseline.totalInterest;

  // Now generate the schedule WITH prepayments
  const hasPrepayments =
    extraMonthlyPrepayment.gt(0) || yearlyLumpSumPrepayment.gt(0);

  if (!hasPrepayments) {
    return {
      baseEmi,
      totalInterestWithoutPrepayment,
      totalInterestWithPrepayment: totalInterestWithoutPrepayment,
      interestSaved: new Decimal(0),
      originalTenureMonths: tenureMonths,
      actualTenureMonths: baseline.schedule.length,
      monthsSaved: 0,
      schedule: baseline.schedule,
    };
  }

  // Schedule WITH prepayments
  const schedule: EmiAmortizationRow[] = [];
  let outstanding = loanPrincipal;
  let cumulativeInterest = new Decimal(0);
  let cumulativePrincipal = new Decimal(0);

  for (let m = 1; m <= tenureMonths; m++) {
    if (outstanding.isZero() || outstanding.isNeg()) break;

    const interestPortion = outstanding.mul(monthlyRate);
    let principalPortion = baseEmi.sub(interestPortion);

    // Clamp principal portion
    if (principalPortion.gt(outstanding)) {
      principalPortion = outstanding;
    }

    outstanding = outstanding.sub(principalPortion);

    // Apply monthly extra prepayment
    let prepayment = new Decimal(0);
    if (extraMonthlyPrepayment.gt(0) && outstanding.gt(0)) {
      const monthlyPrepay = Decimal.min(extraMonthlyPrepayment, outstanding);
      outstanding = outstanding.sub(monthlyPrepay);
      prepayment = prepayment.add(monthlyPrepay);
    }

    // Apply yearly lump-sum at month 12, 24, 36, etc.
    if (
      yearlyLumpSumPrepayment.gt(0) &&
      m % 12 === 0 &&
      outstanding.gt(0)
    ) {
      const lumpPrepay = Decimal.min(yearlyLumpSumPrepayment, outstanding);
      outstanding = outstanding.sub(lumpPrepay);
      prepayment = prepayment.add(lumpPrepay);
    }

    // Guard against tiny negative from rounding
    if (outstanding.isNeg()) {
      outstanding = new Decimal(0);
    }

    cumulativeInterest = cumulativeInterest.add(interestPortion);
    cumulativePrincipal = cumulativePrincipal.add(principalPortion).add(prepayment);

    schedule.push({
      month: m,
      emi: baseEmi,
      principalPortion,
      interestPortion,
      prepayment,
      outstandingBalance: outstanding,
      cumulativeInterest,
      cumulativePrincipal,
    });

    if (outstanding.isZero()) break;
  }

  const totalInterestWithPrepayment = cumulativeInterest;
  const interestSaved = totalInterestWithoutPrepayment.sub(
    totalInterestWithPrepayment
  );
  const actualTenureMonths = schedule.length;
  const monthsSaved = tenureMonths - actualTenureMonths;

  return {
    baseEmi,
    totalInterestWithoutPrepayment,
    totalInterestWithPrepayment,
    interestSaved,
    originalTenureMonths: tenureMonths,
    actualTenureMonths,
    monthsSaved,
    schedule,
  };
}
