import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  BANK_INSTITUTIONS,
  BANK_SCHEMES,
  getSmartRecommendation,
  ADVISORY_PILLARS,
} from './bankRates';
import { calculateFdr } from '@/engine/fdr';
import { calculateDps } from '@/engine/dps';
import { calculateEmi } from '@/engine/emi';

describe('Bank Rates & Schemes Data Integrity', () => {
  it('should have valid bank institutions with high safety scores and ratings', () => {
    const institutions = Object.values(BANK_INSTITUTIONS);
    expect(institutions.length).toBeGreaterThanOrEqual(8);

    institutions.forEach((bank) => {
      expect(bank.id).toBeTruthy();
      expect(bank.name).toBeTruthy();
      expect(bank.safetyScore).toBeGreaterThanOrEqual(85);
      expect(bank.safetyScore).toBeLessThanOrEqual(100);
      expect(bank.creditRating).toBeTruthy();
    });
  });

  it('should have valid schemes for FDR, DPS, and Loans', () => {
    expect(BANK_SCHEMES.length).toBeGreaterThanOrEqual(10);

    const fdrSchemes = BANK_SCHEMES.filter((s) => s.type === 'fdr');
    const dpsSchemes = BANK_SCHEMES.filter((s) => s.type === 'dps');
    const loanSchemes = BANK_SCHEMES.filter((s) => s.type === 'loan');

    expect(fdrSchemes.length).toBeGreaterThanOrEqual(4);
    expect(dpsSchemes.length).toBeGreaterThanOrEqual(3);
    expect(loanSchemes.length).toBeGreaterThanOrEqual(3);

    BANK_SCHEMES.forEach((scheme) => {
      expect(scheme.headlineRate).toBeGreaterThan(0);
      expect(scheme.headlineRate).toBeLessThan(30);
      expect(scheme.whyConsider).toBeTruthy();
      expect(scheme.pros.length).toBeGreaterThan(0);
      expect(scheme.cons.length).toBeGreaterThan(0);
      expect(BANK_INSTITUTIONS[scheme.bankId]).toBeDefined();
    });
  });

  it('should verify that all scheme calculator defaults are valid and run cleanly in FinLens calculation engine', () => {
    BANK_SCHEMES.forEach((scheme) => {
      const def = scheme.calculatorDefaults;

      if (def.tab === 'fdr') {
        const res = calculateFdr({
          principal: new Decimal(def.principal || 100000),
          annualRatePct: new Decimal(def.annualRate),
          tenureMonths: def.tenureMonths,
          compounding: def.compounding || 'quarterly',
          taxPct: new Decimal(10),
          annualFee: new Decimal(0),
          inflationPct: new Decimal(6),
        });
        expect(res.netMaturity.toNumber()).toBeGreaterThan(def.principal || 100000);
      } else if (def.tab === 'dps') {
        const res = calculateDps({
          monthlyInstallment: new Decimal(def.monthlyInstallment || 5000),
          annualRatePct: new Decimal(def.annualRate),
          tenureYears: (def.tenureMonths || 60) / 12,
          compounding: def.compounding || 'monthly',
          annualStepUpPercent: new Decimal(def.stepUpPercent || 0),
          taxPct: new Decimal(10),
          annualFee: new Decimal(0),
          inflationPct: new Decimal(6),
        });
        expect(res.netMaturity.toNumber()).toBeGreaterThan(res.totalDeposited.toNumber());
      } else if (def.tab === 'emi') {
        const res = calculateEmi({
          loanPrincipal: new Decimal(def.loanPrincipal || 5000000),
          annualRatePct: new Decimal(def.annualRate),
          tenureMonths: def.tenureMonths,
          extraMonthlyPrepayment: new Decimal(def.extraMonthly || 0),
          yearlyLumpSumPrepayment: new Decimal(0),
        });
        expect(res.baseEmi.toNumber()).toBeGreaterThan(0);
        expect(res.totalInterestWithoutPrepayment.toNumber()).toBeGreaterThan(0);
      }
    });
  });
});

describe('Smart Recommendation Advisor Logic', () => {
  it('should recommend Sanchayapatra for safety priority lump-sum', () => {
    const rec = getSmartRecommendation({ goal: 'fdr', priority: 'safety' });
    expect(rec.topPick.id).toBe('sanchayapatra-5yr');
    expect(rec.summaryTitle).toContain('Capital Safety');
    expect(rec.verdictExplanation).toContain('sovereign guarantee');
  });

  it('should recommend IDLC for high-return priority lump-sum', () => {
    const rec = getSmartRecommendation({ goal: 'fdr', priority: 'returns' });
    expect(rec.topPick.id).toBe('idlc-term-deposit');
    expect(rec.summaryTitle).toContain('IDLC Finance');
  });

  it('should recommend Shahjalal Islami Bank for Islamic DPS', () => {
    const rec = getSmartRecommendation({ goal: 'dps', priority: 'islamic' });
    expect(rec.topPick.id).toBe('shahjalal-dps');
    expect(rec.topPick.isIslamic).toBe(true);
  });

  it('should recommend BRAC Bank Nibash for loan with prepayment flexibility', () => {
    const rec = getSmartRecommendation({ goal: 'loan', priority: 'balanced' });
    expect(rec.topPick.id).toBe('brac-nibash-home-loan');
    expect(rec.verdictExplanation).toContain('prepayment');
  });
});

describe('Advisory Pillars Integrity', () => {
  it('should have all 4 core decision pillars explained', () => {
    expect(ADVISORY_PILLARS.length).toBe(4);
    const ids = ADVISORY_PILLARS.map((p) => p.id);
    expect(ids).toContain('safety-vs-yield');
    expect(ids).toContain('inflation-hurdle');
    expect(ids).toContain('tax-optimization');
    expect(ids).toContain('loan-prepayment-power');
  });
});
