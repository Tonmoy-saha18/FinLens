/**
 * Adjustments Utilities — Unit Tests
 */
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  discountByInflation,
  applyTax,
  deductFees,
  formatCurrency,
  formatCompact,
  calculateBdExciseDuty,
  getTaxRateForTin,
  detectSplitSavings,
  CURRENCY_PRESETS,
} from './adjustments';

describe('discountByInflation', () => {
  it('should discount a value by inflation correctly', () => {
    // 110000 / (1.05)^1 ≈ 104761.90
    const result = discountByInflation(
      new Decimal(110000),
      new Decimal(5),
      new Decimal(1)
    );
    expect(result.toNumber()).toBeCloseTo(104761.90, 0);
  });

  it('should return the same value when inflation is 0%', () => {
    const result = discountByInflation(
      new Decimal(100000),
      new Decimal(0),
      new Decimal(5)
    );
    expect(result.toNumber()).toBe(100000);
  });

  it('should discount more over longer periods', () => {
    const val = new Decimal(100000);
    const infl = new Decimal(5);
    const one = discountByInflation(val, infl, new Decimal(1));
    const five = discountByInflation(val, infl, new Decimal(5));
    expect(five.lt(one)).toBe(true);
  });
});

describe('applyTax', () => {
  it('should compute tax on interest only', () => {
    const { interest, taxAmount, netAmount } = applyTax(
      new Decimal(110000), // gross
      new Decimal(100000), // principal
      new Decimal(10)      // 10% tax
    );

    expect(interest.toNumber()).toBe(10000);
    expect(taxAmount.toNumber()).toBe(1000);
    expect(netAmount.toNumber()).toBe(109000);
  });

  it('should return zero tax when tax rate is 0', () => {
    const { taxAmount } = applyTax(
      new Decimal(110000),
      new Decimal(100000),
      new Decimal(0)
    );
    expect(taxAmount.toNumber()).toBe(0);
  });
});

describe('deductFees', () => {
  it('should deduct correct total fees', () => {
    const result = deductFees(new Decimal(110000), new Decimal(500), 3);
    expect(result.toNumber()).toBe(108500);
  });

  it('should not deduct when fee is 0', () => {
    const result = deductFees(new Decimal(100000), new Decimal(0), 5);
    expect(result.toNumber()).toBe(100000);
  });
});

describe('formatCurrency', () => {
  it('should format BDT with ৳ symbol', () => {
    const result = formatCurrency(
      new Decimal(1234567.89),
      CURRENCY_PRESETS['BDT']
    );
    expect(result).toBe('৳12,34,567.89');
  });

  it('should format small BDT values', () => {
    const result = formatCurrency(
      new Decimal(999.50),
      CURRENCY_PRESETS['BDT']
    );
    expect(result).toBe('৳999.50');
  });

  it('should format USD with $ symbol', () => {
    const result = formatCurrency(
      new Decimal(1234567.89),
      CURRENCY_PRESETS['USD']
    );
    expect(result).toContain('$');
    expect(result).toContain('1,234,567.89');
  });
});

describe('formatCompact', () => {
  it('should format in Crore (south-asian)', () => {
    expect(formatCompact(new Decimal(15000000))).toBe('1.50Cr');
  });

  it('should format in Lakh (south-asian)', () => {
    expect(formatCompact(new Decimal(500000))).toBe('5.00L');
  });

  it('should format in K (south-asian)', () => {
    expect(formatCompact(new Decimal(5000))).toBe('5.00K');
  });

  it('should format in M (international)', () => {
    expect(formatCompact(new Decimal(5000000), 'international')).toBe('5.00M');
  });

  it('should format in B (international)', () => {
    expect(formatCompact(new Decimal(2000000000), 'international')).toBe('2.00B');
  });

  it('should handle negative values', () => {
    expect(formatCompact(new Decimal(-1500000))).toBe('-15.00L');
  });
});

describe('calculateBdExciseDuty', () => {
  it('should be 0 for balances up to 4 Lakh (4,00,000)', () => {
    expect(calculateBdExciseDuty(new Decimal(0)).toNumber()).toBe(0);
    expect(calculateBdExciseDuty(new Decimal(100000)).toNumber()).toBe(0);
    expect(calculateBdExciseDuty(new Decimal(400000)).toNumber()).toBe(0);
  });

  it('should be 150 for balances between 4,00,001 and 5,00,000', () => {
    expect(calculateBdExciseDuty(new Decimal(400001)).toNumber()).toBe(150);
    expect(calculateBdExciseDuty(new Decimal(500000)).toNumber()).toBe(150);
  });

  it('should be 500 for balances between 5,00,001 and 10,00,000', () => {
    expect(calculateBdExciseDuty(new Decimal(500001)).toNumber()).toBe(500);
    expect(calculateBdExciseDuty(new Decimal(800000)).toNumber()).toBe(500);
    expect(calculateBdExciseDuty(new Decimal(1000000)).toNumber()).toBe(500);
  });

  it('should be 3000 for balances between 10,00,001 and 50,00,000', () => {
    expect(calculateBdExciseDuty(new Decimal(1000001)).toNumber()).toBe(3000);
    expect(calculateBdExciseDuty(new Decimal(2500000)).toNumber()).toBe(3000);
    expect(calculateBdExciseDuty(new Decimal(5000000)).toNumber()).toBe(3000);
  });

  it('should be 5000 for balances between 50,00,001 and 1,00,00,000', () => {
    expect(calculateBdExciseDuty(new Decimal(5000001)).toNumber()).toBe(5000);
    expect(calculateBdExciseDuty(new Decimal(10000000)).toNumber()).toBe(5000);
  });

  it('should be 10000 for balances above 1,00,00,000 (1 Crore)', () => {
    expect(calculateBdExciseDuty(new Decimal(10000001)).toNumber()).toBe(10000);
    expect(calculateBdExciseDuty(new Decimal(50000000)).toNumber()).toBe(10000);
  });
});

describe('getTaxRateForTin', () => {
  it('should return 10% when user has TIN/PSR', () => {
    expect(getTaxRateForTin(true).toNumber()).toBe(10);
  });

  it('should return 15% when user does not have TIN/PSR', () => {
    expect(getTaxRateForTin(false).toNumber()).toBe(15);
  });
});

describe('detectSplitSavings', () => {
  it('should detect savings when 8 Lakh is split into 2 x 4 Lakh', () => {
    // 8L alone: 500/yr. 2 x 4L: 0 + 0 = 0. Annual savings: 500. Over 3 years: 1500.
    const tip = detectSplitSavings(new Decimal(800000), 3);
    expect(tip.canSave).toBe(true);
    expect(tip.originalExcisePerYear.toNumber()).toBe(500);
    expect(tip.splitExcisePerYear.toNumber()).toBe(0);
    expect(tip.annualSavings.toNumber()).toBe(500);
    expect(tip.totalSavingsOverTenure.toNumber()).toBe(1500);
    expect(tip.recommendedSplit).toContain('4.00L');
  });

  it('should detect savings when 12 Lakh is split into 2 x 6 Lakh', () => {
    // 12L alone: 3000/yr. 2 x 6L: 500 + 500 = 1000/yr. Annual savings: 2000.
    const tip = detectSplitSavings(new Decimal(1200000), 2);
    expect(tip.canSave).toBe(true);
    expect(tip.originalExcisePerYear.toNumber()).toBe(3000);
    expect(tip.splitExcisePerYear.toNumber()).toBe(1000);
    expect(tip.annualSavings.toNumber()).toBe(2000);
    expect(tip.totalSavingsOverTenure.toNumber()).toBe(4000);
  });

  it('should indicate no savings if balance is already <= 4 Lakh', () => {
    const tip = detectSplitSavings(new Decimal(300000), 5);
    expect(tip.canSave).toBe(false);
    expect(tip.annualSavings.toNumber()).toBe(0);
  });
});
