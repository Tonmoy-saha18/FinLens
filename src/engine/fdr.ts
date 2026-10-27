/**
 * FinLens Engine — FDR (Fixed Deposit Receipt) Calculator
 *
 * Handles compound and simple interest with tax, fees, and inflation adjustments.
 * ALL arithmetic uses decimal.js — no native float math.
 */
import Decimal from 'decimal.js';
import {
  type FdrInput,
  type FdrResult,
  type FdrPeriodBreakdown,
  compoundingPeriodsPerYear,
} from './types';

/**
 * Calculate FDR maturity with period-by-period breakdown.
 *
 * Compound Interest Formula:
 *   A = P × (1 + r/n)^(n×t)
 * where P = principal, r = annual rate (decimal), n = periods/year, t = years
 *
 * Simple Interest:
 *   A = P × (1 + r×t)
 */
export function calculateFdr(input: FdrInput): FdrResult {
  const {
    principal,
    annualRatePct,
    tenureMonths,
    compounding,
    taxPct,
    annualFee,
    inflationPct,
  } = input;

  // Validate
  if (principal.isNeg() || principal.isZero()) {
    throw new Error('Principal must be positive');
  }
  if (tenureMonths <= 0) {
    throw new Error('Tenure must be positive');
  }
  if (annualRatePct.isNeg()) {
    throw new Error('Interest rate cannot be negative');
  }
  if (taxPct.isNeg() || taxPct.gte(100)) {
    throw new Error('Tax percentage must be >= 0 and < 100');
  }

  const rate = annualRatePct.div(100); // annual rate as decimal
  const tenureYears = new Decimal(tenureMonths).div(12);
  const taxRate = taxPct.div(100);
  const inflationRate = inflationPct.div(100);

  const breakdown: FdrPeriodBreakdown[] = [];

  if (compounding === 'simple') {
    // Simple interest: A = P × (1 + r × t)
    const grossMaturity = principal.mul(Decimal.add(1, rate.mul(tenureYears)));
    const grossInterest = grossMaturity.sub(principal);
    const totalTax = grossInterest.mul(taxRate);
    const totalYears = tenureYears.toNumber();
    const totalFees = annualFee.mul(new Decimal(Math.ceil(totalYears)));
    const netMaturity = grossMaturity.sub(totalTax).sub(totalFees);

    // Build monthly breakdown for simple interest
    for (let m = 1; m <= tenureMonths; m++) {
      const monthFraction = new Decimal(m).div(12);
      const grossBal = principal.mul(Decimal.add(1, rate.mul(monthFraction)));
      const cumInterest = grossBal.sub(principal);
      const cumTax = cumInterest.mul(taxRate);
      const yearsElapsed = Math.ceil(m / 12);
      const cumFees = annualFee.mul(yearsElapsed);
      const netBal = grossBal.sub(cumTax).sub(cumFees);
      const realVal = netBal.div(
        Decimal.add(1, inflationRate).pow(monthFraction)
      );

      breakdown.push({
        period: m,
        label: `Month ${m}`,
        grossBalance: grossBal,
        cumulativeInterest: cumInterest,
        cumulativeTax: cumTax,
        cumulativeFees: cumFees,
        netBalance: netBal,
        realValue: realVal,
      });
    }

    const netEffectiveYieldPct = tenureYears.isZero()
      ? new Decimal(0)
      : netMaturity
          .sub(principal)
          .div(principal)
          .div(tenureYears)
          .mul(100);

    const realPurchasingPower = netMaturity.div(
      Decimal.add(1, inflationRate).pow(tenureYears)
    );

    return {
      principal,
      grossMaturity,
      grossInterest,
      totalTax,
      totalFees,
      netMaturity,
      netEffectiveYieldPct,
      realPurchasingPower,
      breakdown,
    };
  }

  // ── Compound interest ──
  const n = compoundingPeriodsPerYear(compounding);
  const totalPeriods = new Decimal(tenureMonths).div(12).mul(n);
  const ratePerPeriod = rate.div(n);

  // A = P × (1 + r/n)^(n×t)
  const grossMaturity = principal.mul(
    Decimal.add(1, ratePerPeriod).pow(totalPeriods)
  );
  const grossInterest = grossMaturity.sub(principal);

  // Tax is applied on total gross interest
  const totalTax = grossInterest.mul(taxRate);

  // Fees: per full/partial year of tenure
  const totalYears = tenureYears.toNumber();
  const totalFees = annualFee.mul(new Decimal(Math.ceil(totalYears)));

  const netMaturity = grossMaturity.sub(totalTax).sub(totalFees);

  // Period-by-period breakdown — we report per compounding period
  const totalPeriodsInt = Math.ceil(totalPeriods.toNumber());
  const monthsPerPeriod = 12 / n;

  for (let p = 1; p <= totalPeriodsInt; p++) {
    const grossBal = principal.mul(
      Decimal.add(1, ratePerPeriod).pow(p)
    );
    const cumInterest = grossBal.sub(principal);
    const cumTax = cumInterest.mul(taxRate);
    const monthsElapsed = p * monthsPerPeriod;
    const yearsElapsed = Math.ceil(monthsElapsed / 12);
    const cumFees = annualFee.mul(yearsElapsed);
    const netBal = grossBal.sub(cumTax).sub(cumFees);
    const yearsFrac = new Decimal(monthsElapsed).div(12);
    const realVal = netBal.div(
      Decimal.add(1, inflationRate).pow(yearsFrac)
    );

    const label =
      n === 12
        ? `Month ${p}`
        : n === 4
          ? `Quarter ${p}`
          : n === 2
            ? `Half ${p}`
            : `Year ${p}`;

    breakdown.push({
      period: p,
      label,
      grossBalance: grossBal,
      cumulativeInterest: cumInterest,
      cumulativeTax: cumTax,
      cumulativeFees: cumFees,
      netBalance: netBal,
      realValue: realVal,
    });
  }

  // Net effective annual yield
  const netEffectiveYieldPct = tenureYears.isZero()
    ? new Decimal(0)
    : netMaturity
        .sub(principal)
        .div(principal)
        .div(tenureYears)
        .mul(100);

  // Real purchasing power
  const realPurchasingPower = netMaturity.div(
    Decimal.add(1, inflationRate).pow(tenureYears)
  );

  return {
    principal,
    grossMaturity,
    grossInterest,
    totalTax,
    totalFees,
    netMaturity,
    netEffectiveYieldPct,
    realPurchasingPower,
    breakdown,
  };
}
