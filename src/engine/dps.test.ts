/**
 * DPS Engine — Unit Tests
 *
 * Tests cover:
 * - Basic monthly compounding DPS
 * - Quarterly compounding DPS
 * - Simple interest DPS
 * - 0% interest edge case
 * - Tax deduction on total interest
 * - Fee deduction
 * - Inflation adjustment
 * - Monthly breakdown structure and progression
 * - Input validation errors
 */
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateDps } from './dps';
import type { DpsInput } from './types';

/** Helper to create a default DPS input with overrides */
function makeDpsInput(overrides: Partial<DpsInput> = {}): DpsInput {
  return {
    monthlyInstallment: new Decimal(5000),
    annualRatePct: new Decimal(8),
    tenureYears: 5,
    compounding: 'monthly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(0),
    ...overrides,
  };
}

describe('DPS Calculator', () => {
  // ── Basic Calculation ─────────────────────────────────────────

  describe('Basic Monthly Compounding', () => {
    it('should accumulate total deposited correctly', () => {
      const result = calculateDps(
        makeDpsInput({
          monthlyInstallment: new Decimal(5000),
          tenureYears: 5,
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // 5000 × 60 months = 300000
      expect(result.totalDeposited.toNumber()).toBe(300000);
    });

    it('should earn positive interest with positive rate', () => {
      const result = calculateDps(
        makeDpsInput({
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.grossInterest.toNumber()).toBeGreaterThan(0);
      expect(result.netMaturity.gt(result.totalDeposited)).toBe(true);
    });

    it('should calculate reasonable maturity for 5-year DPS', () => {
      const result = calculateDps(
        makeDpsInput({
          monthlyInstallment: new Decimal(10000),
          annualRatePct: new Decimal(8),
          tenureYears: 5,
          compounding: 'monthly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // Total deposited = 600000
      // With 8% monthly compounding over 5 years, gross should be > 700000
      expect(result.totalDeposited.toNumber()).toBe(600000);
      expect(result.netMaturity.toNumber()).toBeGreaterThan(700000);
    });
  });

  // ── Quarterly Compounding ─────────────────────────────────────

  describe('Quarterly Compounding', () => {
    it('should produce different result from monthly compounding', () => {
      const monthly = calculateDps(
        makeDpsInput({
          compounding: 'monthly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      const quarterly = calculateDps(
        makeDpsInput({
          compounding: 'quarterly',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // Monthly compounding should yield slightly more
      expect(monthly.grossInterest.toNumber()).not.toBe(
        quarterly.grossInterest.toNumber()
      );
    });
  });

  // ── Simple Interest ───────────────────────────────────────────

  describe('Simple Interest', () => {
    it('should calculate simple interest DPS', () => {
      const result = calculateDps(
        makeDpsInput({
          monthlyInstallment: new Decimal(5000),
          annualRatePct: new Decimal(10),
          tenureYears: 1,
          compounding: 'simple',
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      // 12 installments of 5000 = 60000 total deposited
      expect(result.totalDeposited.toNumber()).toBe(60000);
      // Should earn some interest
      expect(result.grossInterest.toNumber()).toBeGreaterThan(0);
      expect(result.netMaturity.gt(result.totalDeposited)).toBe(true);
    });
  });

  // ── 0% Interest ───────────────────────────────────────────────

  describe('Edge: 0% Interest', () => {
    it('should return just the deposits with 0% interest', () => {
      const result = calculateDps(
        makeDpsInput({
          annualRatePct: new Decimal(0),
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.grossInterest.toNumber()).toBe(0);
      expect(result.netMaturity.toNumber()).toBe(result.totalDeposited.toNumber());
    });

    it('should still deduct fees with 0% interest', () => {
      const result = calculateDps(
        makeDpsInput({
          annualRatePct: new Decimal(0),
          tenureYears: 2,
          taxPct: new Decimal(0),
          annualFee: new Decimal(100),
        })
      );

      // Total deposited = 5000 × 24 = 120000, fees = 100 × 2 = 200
      expect(result.netMaturity.toNumber()).toBe(119800);
    });
  });

  // ── Tax ───────────────────────────────────────────────────────

  describe('Tax Application', () => {
    it('should deduct tax on gross interest only', () => {
      const result = calculateDps(
        makeDpsInput({
          taxPct: new Decimal(15),
          annualFee: new Decimal(0),
        })
      );

      const expectedTax = result.grossInterest.mul(new Decimal(0.15));
      expect(result.totalTax.toNumber()).toBeCloseTo(expectedTax.toNumber(), 2);
      expect(result.netInterest.toNumber()).toBeCloseTo(
        result.grossInterest.sub(result.totalTax).toNumber(),
        2
      );
    });

    it('should not deduct tax when tax is 0%', () => {
      const result = calculateDps(
        makeDpsInput({
          taxPct: new Decimal(0),
        })
      );

      expect(result.totalTax.toNumber()).toBe(0);
      expect(result.netInterest.toNumber()).toBe(result.grossInterest.toNumber());
    });
  });

  // ── Fees ──────────────────────────────────────────────────────

  describe('Fee Deduction', () => {
    it('should deduct annual fees for each year', () => {
      const result = calculateDps(
        makeDpsInput({
          tenureYears: 3,
          annualFee: new Decimal(200),
          taxPct: new Decimal(0),
        })
      );

      expect(result.totalFees.toNumber()).toBe(600);
    });
  });

  // ── Inflation Adjustment ──────────────────────────────────────

  describe('Inflation Adjustment', () => {
    it('should reduce real purchasing power with positive inflation', () => {
      const result = calculateDps(
        makeDpsInput({
          inflationPct: new Decimal(6),
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.realPurchasingPower.lt(result.netMaturity)).toBe(true);
    });

    it('should equal net maturity when inflation is 0%', () => {
      const result = calculateDps(
        makeDpsInput({
          inflationPct: new Decimal(0),
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      expect(result.realPurchasingPower.toNumber()).toBeCloseTo(
        result.netMaturity.toNumber(),
        2
      );
    });
  });

  // ── Breakdown Structure ───────────────────────────────────────

  describe('Breakdown', () => {
    it('should have correct number of monthly entries', () => {
      const result = calculateDps(
        makeDpsInput({
          tenureYears: 3,
        })
      );

      expect(result.breakdown.length).toBe(36);
    });

    it('should show increasing total deposited each month', () => {
      const result = calculateDps(
        makeDpsInput({
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      for (let i = 1; i < result.breakdown.length; i++) {
        expect(
          result.breakdown[i]!.totalDeposited.gt(result.breakdown[i - 1]!.totalDeposited)
        ).toBe(true);
      }
    });

    it('should show increasing gross balance each month', () => {
      const result = calculateDps(
        makeDpsInput({
          annualRatePct: new Decimal(8),
          taxPct: new Decimal(0),
          annualFee: new Decimal(0),
        })
      );

      for (let i = 1; i < result.breakdown.length; i++) {
        expect(
          result.breakdown[i]!.grossBalance.gt(result.breakdown[i - 1]!.grossBalance)
        ).toBe(true);
      }
    });

    it('first month deposited should equal one installment', () => {
      const installment = new Decimal(10000);
      const result = calculateDps(
        makeDpsInput({ monthlyInstallment: installment })
      );

      expect(result.breakdown[0]!.totalDeposited.toNumber()).toBe(10000);
    });

    it('last month deposited should equal total deposited', () => {
      const result = calculateDps(makeDpsInput());
      const last = result.breakdown[result.breakdown.length - 1]!;
      expect(last.totalDeposited.toNumber()).toBe(result.totalDeposited.toNumber());
    });
  });

  // ── Validation ────────────────────────────────────────────────

  describe('Input Validation', () => {
    it('should throw on negative installment', () => {
      expect(() =>
        calculateDps(
          makeDpsInput({ monthlyInstallment: new Decimal(-1000) })
        )
      ).toThrow('Monthly installment must be positive');
    });

    it('should throw on zero installment', () => {
      expect(() =>
        calculateDps(
          makeDpsInput({ monthlyInstallment: new Decimal(0) })
        )
      ).toThrow('Monthly installment must be positive');
    });

    it('should throw on zero tenure', () => {
      expect(() =>
        calculateDps(makeDpsInput({ tenureYears: 0 }))
      ).toThrow('Tenure must be positive');
    });

    it('should throw on negative rate', () => {
      expect(() =>
        calculateDps(makeDpsInput({ annualRatePct: new Decimal(-2) }))
      ).toThrow('Interest rate cannot be negative');
    });

    it('should throw on tax >= 100%', () => {
      expect(() =>
        calculateDps(makeDpsInput({ taxPct: new Decimal(100) }))
      ).toThrow('Tax percentage must be >= 0 and < 100');
    });
  });

  // ── Real-World Scenario ───────────────────────────────────────

  describe('Real-World: BD Bank DPS', () => {
    it('should compute a typical 5-year BD DPS', () => {
      // ৳5,000/month at 7.5% for 5 years, quarterly compounding, 10% AIT
      const result = calculateDps(
        makeDpsInput({
          monthlyInstallment: new Decimal(5000),
          annualRatePct: new Decimal(7.5),
          tenureYears: 5,
          compounding: 'quarterly',
          taxPct: new Decimal(10),
          annualFee: new Decimal(0),
          inflationPct: new Decimal(6),
        })
      );

      expect(result.totalDeposited.toNumber()).toBe(300000);
      expect(result.grossInterest.toNumber()).toBeGreaterThan(0);
      expect(result.totalTax.toNumber()).toBeGreaterThan(0);
      expect(result.netMaturity.gt(result.totalDeposited)).toBe(true);
      expect(result.realPurchasingPower.lt(result.netMaturity)).toBe(true);
      expect(result.breakdown.length).toBe(60);
    });
  });
});
