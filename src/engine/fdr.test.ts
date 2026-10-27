/**
 * FDR Engine — Unit Tests
 *
 * Tests cover:
 * - Simple interest maturity
 * - Compound interest (monthly, quarterly, yearly)
 * - 0% interest edge case
 * - Tax deduction on interest
 * - Annual fee deduction
 * - Inflation-adjusted purchasing power
 * - Period breakdown structure
 * - Input validation errors
 */
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateFdr } from './fdr';
import type { FdrInput } from './types';

/** Helper to create a default FDR input with overrides */
function makeFdrInput(overrides: Partial<FdrInput> = {}): FdrInput {
  return {
    principal: new Decimal(100000),
    annualRatePct: new Decimal(7.5),
    tenureMonths: 12,
    compounding: 'yearly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(0),
    ...overrides,
  };
}

describe('FDR Calculator', () => {
  // ── Simple Interest ───────────────────────────────────────────

  describe('Simple Interest', () => {
    it('should calculate correct simple interest maturity', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 12,
          compounding: 'simple',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // A = 100000 × (1 + 0.10 × 1) = 110000
      expect(result.grossMaturity.toNumber()).toBeCloseTo(110000, 2);
      expect(result.grossInterest.toNumber()).toBeCloseTo(10000, 2);
      expect(result.netMaturity.toNumber()).toBeCloseTo(110000, 2);
    });

    it('should handle 6-month simple interest correctly', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(200000),
          annualRatePct: new Decimal(8),
          tenureMonths: 6,
          compounding: 'simple',
          taxPct: new Decimal(0),
        })
      );

      // A = 200000 × (1 + 0.08 × 0.5) = 208000
      expect(result.grossMaturity.toNumber()).toBeCloseTo(208000, 2);
    });

    it('should apply tax on simple interest', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 12,
          compounding: 'simple',
          taxPct: new Decimal(15),
          annualFee: new Decimal(0),
        })
      );

      // Interest = 10000, Tax = 10000 × 0.15 = 1500
      expect(result.grossInterest.toNumber()).toBeCloseTo(10000, 2);
      expect(result.totalTax.toNumber()).toBeCloseTo(1500, 2);
      expect(result.netMaturity.toNumber()).toBeCloseTo(108500, 2);
    });
  });

  // ── Compound Interest ─────────────────────────────────────────

  describe('Compound Interest', () => {
    it('should calculate yearly compounding correctly', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 24, // 2 years
          compounding: 'yearly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // A = 100000 × (1 + 0.10)^2 = 121000
      expect(result.grossMaturity.toNumber()).toBeCloseTo(121000, 2);
    });

    it('should calculate quarterly compounding correctly', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(8),
          tenureMonths: 12,
          compounding: 'quarterly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // A = 100000 × (1 + 0.08/4)^4 = 100000 × (1.02)^4 ≈ 108243.22
      expect(result.grossMaturity.toNumber()).toBeCloseTo(108243.22, 0);
    });

    it('should calculate monthly compounding correctly', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(500000),
          annualRatePct: new Decimal(6),
          tenureMonths: 36, // 3 years
          compounding: 'monthly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // A = 500000 × (1 + 0.06/12)^36 = 500000 × (1.005)^36 ≈ 598,340.45
      expect(result.grossMaturity.toNumber()).toBeCloseTo(598340.45, 0);
    });

    it('should apply tax on compound interest', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 12,
          compounding: 'yearly',
          taxPct: new Decimal(10),
          annualFee: new Decimal(0),
        })
      );

      // Interest = 10000, Tax = 1000
      expect(result.grossInterest.toNumber()).toBeCloseTo(10000, 2);
      expect(result.totalTax.toNumber()).toBeCloseTo(1000, 2);
      expect(result.netMaturity.toNumber()).toBeCloseTo(109000, 2);
    });

    it('should deduct annual fees correctly', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 24, // 2 years
          compounding: 'yearly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(500),
        })
      );

      // Gross = 121000, Fees = 500 × 2 = 1000, Net = 120000
      expect(result.grossMaturity.toNumber()).toBeCloseTo(121000, 2);
      expect(result.totalFees.toNumber()).toBeCloseTo(1000, 2);
      expect(result.netMaturity.toNumber()).toBeCloseTo(120000, 2);
    });
  });

  // ── Zero Interest ─────────────────────────────────────────────

  describe('Edge: 0% Interest', () => {
    it('should return principal unchanged with 0% interest (simple)', () => {
      const result = calculateFdr(
        makeFdrInput({
          annualRatePct: new Decimal(0),
          compounding: 'simple',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.grossMaturity.toNumber()).toBe(100000);
      expect(result.grossInterest.toNumber()).toBe(0);
      expect(result.netMaturity.toNumber()).toBe(100000);
    });

    it('should return principal unchanged with 0% interest (compound)', () => {
      const result = calculateFdr(
        makeFdrInput({
          annualRatePct: new Decimal(0),
          compounding: 'monthly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.grossMaturity.toNumber()).toBe(100000);
      expect(result.grossInterest.toNumber()).toBe(0);
    });

    it('should still deduct fees even with 0% interest', () => {
      const result = calculateFdr(
        makeFdrInput({
          annualRatePct: new Decimal(0),
          compounding: 'yearly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(200),
        })
      );

      // 100000 - 200 = 99800
      expect(result.netMaturity.toNumber()).toBe(99800);
    });
  });

  // ── Zero Tax ──────────────────────────────────────────────────

  describe('Edge: 0% Tax', () => {
    it('should not deduct any tax when tax is 0%', () => {
      const result = calculateFdr(
        makeFdrInput({
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.totalTax.toNumber()).toBe(0);
      expect(result.netMaturity.eq(result.grossMaturity)).toBe(true);
    });
  });

  // ── Inflation Adjustment ──────────────────────────────────────

  describe('Inflation Adjustment', () => {
    it('should discount net maturity by inflation', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 12,
          compounding: 'yearly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
          inflationPct: new Decimal(5),
        })
      );

      // Net = 110000, Real = 110000 / (1.05)^1 ≈ 104761.90
      expect(result.realPurchasingPower.toNumber()).toBeCloseTo(104761.90, 0);
    });

    it('should return net maturity as-is when inflation is 0', () => {
      const result = calculateFdr(
        makeFdrInput({
          inflationPct: new Decimal(0),
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(
        result.realPurchasingPower.toNumber()
      ).toBeCloseTo(result.netMaturity.toNumber(), 2);
    });
  });

  // ── Net Effective Yield ───────────────────────────────────────

  describe('Net Effective Yield', () => {
    it('should compute correct net effective yield', () => {
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 12,
          compounding: 'yearly',
          taxPct: new Decimal(10),
          annualFee: new Decimal(0),
        })
      );

      // Net profit = 109000 - 100000 = 9000
      // Yield = 9000 / 100000 / 1 year × 100 = 9%
      expect(result.netEffectiveYieldPct.toNumber()).toBeCloseTo(9, 2);
    });
  });

  // ── Breakdown Structure ───────────────────────────────────────

  describe('Breakdown', () => {
    it('should have correct number of periods for yearly compounding', () => {
      const result = calculateFdr(
        makeFdrInput({
          tenureMonths: 36, // 3 years
          compounding: 'yearly',
        })
      );

      expect(result.breakdown.length).toBe(3);
      expect(result.breakdown[0]!.label).toBe('Year 1');
    });

    it('should have correct number of periods for quarterly compounding', () => {
      const result = calculateFdr(
        makeFdrInput({
          tenureMonths: 12,
          compounding: 'quarterly',
        })
      );

      expect(result.breakdown.length).toBe(4);
      expect(result.breakdown[0]!.label).toBe('Quarter 1');
    });

    it('should have correct number of periods for monthly compounding', () => {
      const result = calculateFdr(
        makeFdrInput({
          tenureMonths: 6,
          compounding: 'monthly',
        })
      );

      expect(result.breakdown.length).toBe(6);
      expect(result.breakdown[0]!.label).toBe('Month 1');
    });

    it('should have monthly breakdown for simple interest', () => {
      const result = calculateFdr(
        makeFdrInput({
          tenureMonths: 12,
          compounding: 'simple',
        })
      );

      expect(result.breakdown.length).toBe(12);
    });

    it('breakdown balances should be monotonically increasing', () => {
      const result = calculateFdr(
        makeFdrInput({
          annualRatePct: new Decimal(10),
          tenureMonths: 24,
          compounding: 'quarterly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      for (let i = 1; i < result.breakdown.length; i++) {
        expect(
          result.breakdown[i]!.grossBalance.gte(result.breakdown[i - 1]!.grossBalance)
        ).toBe(true);
      }
    });
  });

  // ── Validation ────────────────────────────────────────────────

  describe('Input Validation', () => {
    it('should throw on negative principal', () => {
      expect(() =>
        calculateFdr(makeFdrInput({ principal: new Decimal(-1000) }))
      ).toThrow('Principal must be positive');
    });

    it('should throw on zero principal', () => {
      expect(() =>
        calculateFdr(makeFdrInput({ principal: new Decimal(0) }))
      ).toThrow('Principal must be positive');
    });

    it('should throw on zero tenure', () => {
      expect(() =>
        calculateFdr(makeFdrInput({ tenureMonths: 0 }))
      ).toThrow('Tenure must be positive');
    });

    it('should throw on negative interest rate', () => {
      expect(() =>
        calculateFdr(makeFdrInput({ annualRatePct: new Decimal(-5) }))
      ).toThrow('Interest rate cannot be negative');
    });

    it('should throw on tax >= 100%', () => {
      expect(() =>
        calculateFdr(makeFdrInput({ taxPct: new Decimal(100) }))
      ).toThrow('Tax percentage must be >= 0 and < 100');
    });
  });

  // ── Real-World Scenario: Bangladesh FDR ───────────────────────

  describe('Real-World: BD Bank FDR', () => {
    it('should compute a typical 1-year BD bank FDR correctly', () => {
      // ৳5,00,000 at 7% for 1 year, quarterly compounding, 10% AIT, ৳150 excise
      const result = calculateFdr(
        makeFdrInput({
          principal: new Decimal(500000),
          annualRatePct: new Decimal(7),
          tenureMonths: 12,
          compounding: 'quarterly',
          taxPct: new Decimal(10),
          annualFee: new Decimal(150),
          inflationPct: new Decimal(6),
        })
      );

      // Gross = 500000 × (1 + 0.07/4)^4 ≈ 535,901.95 (using exact decimal.js)
      expect(result.grossMaturity.toNumber()).toBeGreaterThan(535000);
      expect(result.grossMaturity.toNumber()).toBeLessThan(536500);

      // Tax = interest × 10%
      expect(result.totalTax.toNumber()).toBeGreaterThan(3500);
      expect(result.totalTax.toNumber()).toBeLessThan(3700);

      // Fees = 150
      expect(result.totalFees.toNumber()).toBe(150);

      // Net should be less than gross
      expect(result.netMaturity.lt(result.grossMaturity)).toBe(true);

      // Real purchasing power should be less than net
      expect(result.realPurchasingPower.lt(result.netMaturity)).toBe(true);

      // Breakdown should exist
      expect(result.breakdown.length).toBe(4);
    });
  });
});
