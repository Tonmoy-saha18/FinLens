/**
 * EMI Engine — Unit Tests
 *
 * Tests cover:
 * - Basic EMI calculation (standard reducing balance)
 * - 0% interest edge case
 * - Prepayment: extra monthly
 * - Prepayment: yearly lump-sum
 * - Prepayment: both combined
 * - Prepayment exceeding remaining balance
 * - Amortization schedule structure
 * - Schedule sums consistency
 * - Input validation errors
 */
import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateEmi } from './emi';
import type { EmiInput } from './types';

/** Helper to create a default EMI input with overrides */
function makeEmiInput(overrides: Partial<EmiInput> = {}): EmiInput {
  return {
    loanPrincipal: new Decimal(1000000),
    annualRatePct: new Decimal(10),
    tenureMonths: 120, // 10 years
    extraMonthlyPrepayment: new Decimal(0),
    yearlyLumpSumPrepayment: new Decimal(0),
    ...overrides,
  };
}

describe('EMI Calculator', () => {
  // ── Basic EMI ─────────────────────────────────────────────────

  describe('Base EMI Calculation', () => {
    it('should calculate correct monthly EMI', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(1000000),
          annualRatePct: new Decimal(10),
          tenureMonths: 12,
        })
      );

      // EMI for 10L at 10% for 12 months ≈ 87,916
      expect(result.baseEmi.toNumber()).toBeCloseTo(87916, -1);
    });

    it('should calculate EMI for a home loan scenario', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(5000000),
          annualRatePct: new Decimal(8.5),
          tenureMonths: 240, // 20 years
        })
      );

      // EMI for 50L at 8.5% for 20 years ≈ 43,391
      expect(result.baseEmi.toNumber()).toBeCloseTo(43391, -1);
    });

    it('should have total interest > 0 for positive rate', () => {
      const result = calculateEmi(makeEmiInput());
      expect(result.totalInterestWithoutPrepayment.toNumber()).toBeGreaterThan(0);
    });

    it('should repay the full principal over tenure', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(500000),
          annualRatePct: new Decimal(12),
          tenureMonths: 60,
        })
      );

      const lastRow = result.schedule[result.schedule.length - 1]!;
      expect(lastRow.outstandingBalance.toNumber()).toBeCloseTo(0, 1);
    });
  });

  // ── 0% Interest ───────────────────────────────────────────────

  describe('Edge: 0% Interest', () => {
    it('should compute EMI as simple division with 0% rate', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(120000),
          annualRatePct: new Decimal(0),
          tenureMonths: 12,
        })
      );

      // 120000 / 12 = 10000
      expect(result.baseEmi.toNumber()).toBe(10000);
      expect(result.totalInterestWithoutPrepayment.toNumber()).toBe(0);
    });

    it('should clear balance in exact tenure months at 0%', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(60000),
          annualRatePct: new Decimal(0),
          tenureMonths: 6,
        })
      );

      expect(result.schedule.length).toBe(6);
      expect(
        result.schedule[result.schedule.length - 1]!.outstandingBalance.toNumber()
      ).toBeCloseTo(0, 2);
    });
  });

  // ── Prepayment: Monthly Extra ─────────────────────────────────

  describe('Monthly Prepayment', () => {
    it('should reduce tenure with extra monthly payment', () => {
      const base = calculateEmi(makeEmiInput());
      const withPrepay = calculateEmi(
        makeEmiInput({
          extraMonthlyPrepayment: new Decimal(5000),
        })
      );

      expect(withPrepay.actualTenureMonths).toBeLessThan(base.actualTenureMonths);
      expect(withPrepay.monthsSaved).toBeGreaterThan(0);
    });

    it('should save interest with extra monthly payment', () => {
      const result = calculateEmi(
        makeEmiInput({
          extraMonthlyPrepayment: new Decimal(5000),
        })
      );

      expect(result.interestSaved.toNumber()).toBeGreaterThan(0);
      expect(
        result.totalInterestWithPrepayment.lt(result.totalInterestWithoutPrepayment)
      ).toBe(true);
    });
  });

  // ── Prepayment: Yearly Lump-Sum ───────────────────────────────

  describe('Yearly Lump-Sum Prepayment', () => {
    it('should reduce tenure with yearly lump-sum', () => {
      const base = calculateEmi(makeEmiInput());
      const withLump = calculateEmi(
        makeEmiInput({
          yearlyLumpSumPrepayment: new Decimal(50000),
        })
      );

      expect(withLump.actualTenureMonths).toBeLessThan(base.actualTenureMonths);
      expect(withLump.monthsSaved).toBeGreaterThan(0);
    });

    it('should save interest with yearly lump-sum', () => {
      const result = calculateEmi(
        makeEmiInput({
          yearlyLumpSumPrepayment: new Decimal(100000),
        })
      );

      expect(result.interestSaved.toNumber()).toBeGreaterThan(0);
    });

    it('should apply lump-sum at every 12th month', () => {
      const result = calculateEmi(
        makeEmiInput({
          tenureMonths: 36,
          yearlyLumpSumPrepayment: new Decimal(10000),
        })
      );

      // Check that months 12 and 24 have prepayments
      const month12 = result.schedule.find((r) => r.month === 12);
      expect(month12).toBeDefined();
      expect(month12!.prepayment.toNumber()).toBeGreaterThan(0);
    });
  });

  // ── Combined Prepayments ──────────────────────────────────────

  describe('Combined Prepayments', () => {
    it('should compound savings with both prepayment types', () => {
      const monthlyOnly = calculateEmi(
        makeEmiInput({
          extraMonthlyPrepayment: new Decimal(5000),
        })
      );

      const combined = calculateEmi(
        makeEmiInput({
          extraMonthlyPrepayment: new Decimal(5000),
          yearlyLumpSumPrepayment: new Decimal(50000),
        })
      );

      expect(combined.interestSaved.gt(monthlyOnly.interestSaved)).toBe(true);
      expect(combined.actualTenureMonths).toBeLessThan(
        monthlyOnly.actualTenureMonths
      );
    });
  });

  // ── Prepayment Exceeding Balance ──────────────────────────────

  describe('Edge: Prepayment Exceeding Balance', () => {
    it('should handle extra monthly prepayment exceeding remaining balance', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(100000),
          annualRatePct: new Decimal(10),
          tenureMonths: 60,
          extraMonthlyPrepayment: new Decimal(50000), // Huge prepayment
        })
      );

      // Should complete very quickly
      expect(result.actualTenureMonths).toBeLessThan(10);

      // Outstanding should never go negative
      result.schedule.forEach((row) => {
        expect(row.outstandingBalance.toNumber()).toBeGreaterThanOrEqual(0);
      });

      // Last row should be zero
      expect(
        result.schedule[result.schedule.length - 1]!.outstandingBalance.toNumber()
      ).toBeCloseTo(0, 2);
    });

    it('should handle lump-sum exceeding remaining balance', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(50000),
          annualRatePct: new Decimal(10),
          tenureMonths: 24,
          yearlyLumpSumPrepayment: new Decimal(1000000), // Way more than balance
        })
      );

      // Should not go negative
      result.schedule.forEach((row) => {
        expect(row.outstandingBalance.toNumber()).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ── Schedule Structure ────────────────────────────────────────

  describe('Amortization Schedule', () => {
    it('should have decreasing outstanding balance', () => {
      const result = calculateEmi(makeEmiInput());

      for (let i = 1; i < result.schedule.length; i++) {
        expect(
          result.schedule[i]!.outstandingBalance.lte(
            result.schedule[i - 1]!.outstandingBalance
          )
        ).toBe(true);
      }
    });

    it('should have increasing cumulative interest', () => {
      const result = calculateEmi(makeEmiInput());

      for (let i = 1; i < result.schedule.length; i++) {
        expect(
          result.schedule[i]!.cumulativeInterest.gte(
            result.schedule[i - 1]!.cumulativeInterest
          )
        ).toBe(true);
      }
    });

    it('should have increasing cumulative principal', () => {
      const result = calculateEmi(makeEmiInput());

      for (let i = 1; i < result.schedule.length; i++) {
        expect(
          result.schedule[i]!.cumulativePrincipal.gte(
            result.schedule[i - 1]!.cumulativePrincipal
          )
        ).toBe(true);
      }
    });

    it('EMI should equal principal + interest portions each month', () => {
      const result = calculateEmi(
        makeEmiInput({
          annualRatePct: new Decimal(12),
          tenureMonths: 24,
        })
      );

      result.schedule.forEach((row) => {
        const sum = row.principalPortion.add(row.interestPortion);
        // Allow small rounding difference
        expect(Math.abs(sum.sub(row.emi).toNumber())).toBeLessThan(0.01);
      });
    });

    it('final cumulative principal + prepayments should equal loan amount', () => {
      const principal = new Decimal(500000);
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: principal,
          annualRatePct: new Decimal(10),
          tenureMonths: 60,
          extraMonthlyPrepayment: new Decimal(2000),
        })
      );

      const lastRow = result.schedule[result.schedule.length - 1]!;
      // Cumulative principal paid (includes prepayments) should approximately equal loan
      expect(lastRow.cumulativePrincipal.toNumber()).toBeCloseTo(
        principal.toNumber(),
        0
      );
    });
  });

  // ── No Prepayment Result ──────────────────────────────────────

  describe('No Prepayment', () => {
    it('should report zero interest saved and zero months saved', () => {
      const result = calculateEmi(makeEmiInput());

      expect(result.interestSaved.toNumber()).toBe(0);
      expect(result.monthsSaved).toBe(0);
      expect(
        result.totalInterestWithPrepayment.eq(result.totalInterestWithoutPrepayment)
      ).toBe(true);
    });
  });

  // ── Validation ────────────────────────────────────────────────

  describe('Input Validation', () => {
    it('should throw on negative principal', () => {
      expect(() =>
        calculateEmi(makeEmiInput({ loanPrincipal: new Decimal(-100) }))
      ).toThrow('Loan principal must be positive');
    });

    it('should throw on zero principal', () => {
      expect(() =>
        calculateEmi(makeEmiInput({ loanPrincipal: new Decimal(0) }))
      ).toThrow('Loan principal must be positive');
    });

    it('should throw on zero tenure', () => {
      expect(() =>
        calculateEmi(makeEmiInput({ tenureMonths: 0 }))
      ).toThrow('Tenure must be positive');
    });

    it('should throw on negative rate', () => {
      expect(() =>
        calculateEmi(makeEmiInput({ annualRatePct: new Decimal(-5) }))
      ).toThrow('Interest rate cannot be negative');
    });

    it('should throw on negative monthly prepayment', () => {
      expect(() =>
        calculateEmi(
          makeEmiInput({ extraMonthlyPrepayment: new Decimal(-1000) })
        )
      ).toThrow('Extra monthly prepayment cannot be negative');
    });

    it('should throw on negative yearly prepayment', () => {
      expect(() =>
        calculateEmi(
          makeEmiInput({ yearlyLumpSumPrepayment: new Decimal(-5000) })
        )
      ).toThrow('Yearly lump-sum prepayment cannot be negative');
    });
  });

  // ── Real-World Scenario ───────────────────────────────────────

  describe('Real-World: Home Loan with Prepayment', () => {
    it('should show significant savings on a 20-year home loan with prepayments', () => {
      const result = calculateEmi(
        makeEmiInput({
          loanPrincipal: new Decimal(4000000), // 40 Lakh
          annualRatePct: new Decimal(9),
          tenureMonths: 240, // 20 years
          extraMonthlyPrepayment: new Decimal(5000),
          yearlyLumpSumPrepayment: new Decimal(100000),
        })
      );

      // Should save significant interest
      expect(result.interestSaved.toNumber()).toBeGreaterThan(500000);

      // Should shave off many months
      expect(result.monthsSaved).toBeGreaterThan(24);

      // Schedule should end early
      expect(result.actualTenureMonths).toBeLessThan(240);

      // Outstanding should end at 0
      const last = result.schedule[result.schedule.length - 1]!;
      expect(last.outstandingBalance.toNumber()).toBeCloseTo(0, 1);
    });
  });
});
