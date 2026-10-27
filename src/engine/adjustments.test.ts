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
