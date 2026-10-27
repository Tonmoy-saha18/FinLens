import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { calculateFdr } from './fdr';
import { calculateEmi } from './emi';
import {
  alignScenariosTimeline,
  determineWinner,
  type PinnedScenario,
} from './comparison';

describe('Scenario Comparison Engine', () => {
  const fdrA = calculateFdr({
    principal: new Decimal(100000),
    annualRatePct: new Decimal(8.0),
    tenureMonths: 12,
    compounding: 'monthly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(6),
  });

  const fdrB = calculateFdr({
    principal: new Decimal(100000),
    annualRatePct: new Decimal(10.0),
    tenureMonths: 12,
    compounding: 'monthly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(6),
  });

  const scenarios: PinnedScenario[] = [
    {
      id: 'sc-1',
      name: 'Bank A 8%',
      type: 'fdr',
      color: '#6366f1',
      params: {},
      result: fdrA,
    },
    {
      id: 'sc-2',
      name: 'Bank B 10%',
      type: 'fdr',
      color: '#10b981',
      params: {},
      result: fdrB,
    },
  ];

  it('correctly identifies the higher yield winner between 2 FDRs', () => {
    const winner = determineWinner(scenarios);
    expect(winner.winnerId).toBe('sc-2');
    expect(winner.badgeLabel).toContain('Top Net Yield');
  });

  it('aligns multiple scenarios onto a shared timeline array', () => {
    const timeline = alignScenariosTimeline(scenarios);
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline[0]).toHaveProperty('month');
    expect(timeline[0]).toHaveProperty('label');
    expect(timeline[0]).toHaveProperty('sc-1');
    expect(timeline[0]).toHaveProperty('sc-2');
    // Scenario B (10%) should be higher than Scenario A (8%)
    const lastPoint = timeline[timeline.length - 1]!;
    expect(Number(lastPoint['sc-2'])).toBeGreaterThan(Number(lastPoint['sc-1']));
  });

  it('correctly identifies the lowest cost winner between loan scenarios', () => {
    const emiBase = calculateEmi({
      loanPrincipal: new Decimal(1000000),
      annualRatePct: new Decimal(9.0),
      tenureMonths: 120,
      extraMonthlyPrepayment: new Decimal(0),
      yearlyLumpSumPrepayment: new Decimal(0),
    });

    const emiPrepay = calculateEmi({
      loanPrincipal: new Decimal(1000000),
      annualRatePct: new Decimal(9.0),
      tenureMonths: 120,
      extraMonthlyPrepayment: new Decimal(2000),
      yearlyLumpSumPrepayment: new Decimal(0),
    });

    const loanScenarios: PinnedScenario[] = [
      {
        id: 'loan-standard',
        name: 'Standard Loan',
        type: 'emi',
        color: '#f43f5e',
        params: {},
        result: emiBase,
      },
      {
        id: 'loan-prepaid',
        name: 'Prepaid Loan',
        type: 'emi',
        color: '#10b981',
        params: {},
        result: emiPrepay,
      },
    ];

    const winner = determineWinner(loanScenarios);
    expect(winner.winnerId).toBe('loan-prepaid');
    expect(winner.badgeLabel).toContain('Lowest Total Cost');
  });
});
