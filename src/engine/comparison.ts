/**
 * FinLens Engine — Scenario Comparison Utilities
 *
 * Normalizes and aligns multiple financial scenarios (FDR, DPS, EMI)
 * across a common time axis for unified multi-series chart visualization
 * and automated winner determination.
 */
import Decimal from 'decimal.js';
import { type FdrResult, type DpsResult, type EmiResult } from './types';

export type ScenarioType = 'fdr' | 'dps' | 'emi';

export interface PinnedScenario {
  id: string;
  name: string;
  type: ScenarioType;
  color: string;
  params: Record<string, any>;
  result: FdrResult | DpsResult | EmiResult;
}

export interface UnifiedChartPoint {
  month: number;
  label: string;
  [scenarioId: string]: number | string;
}

/**
 * Align up to 3 scenarios onto a unified monthly timeline.
 * Fills forward after maturity so users can see long-term comparative trajectory.
 */
export function alignScenariosTimeline(
  scenarios: PinnedScenario[],
  useRealValue: boolean = false
): UnifiedChartPoint[] {
  if (scenarios.length === 0) return [];

  // Determine max duration in months across all scenarios
  let maxMonths = 0;
  for (const s of scenarios) {
    let months = 0;
    if (s.type === 'fdr') {
      months = (s.result as FdrResult).breakdown.length;
    } else if (s.type === 'dps') {
      months = (s.result as DpsResult).breakdown.length;
    } else if (s.type === 'emi') {
      months = (s.result as EmiResult).schedule.length;
    }
    if (months > maxMonths) maxMonths = months;
  }

  if (maxMonths === 0) return [];

  // Sample intelligently if timeline is very long
  const maxPoints = 60;
  const step = maxMonths > maxPoints ? Math.ceil(maxMonths / maxPoints) : 1;

  const points: UnifiedChartPoint[] = [];

  for (let m = 1; m <= maxMonths; m += step) {
    const yr = Math.floor((m - 1) / 12) + 1;
    const mo = ((m - 1) % 12) + 1;
    const label = maxMonths > 36 ? `Y${yr} M${mo}` : `M${m}`;

    const pt: UnifiedChartPoint = {
      month: m,
      label,
    };

    for (const s of scenarios) {
      pt[s.id] = getScenarioValueAtMonth(s, m, useRealValue);
    }

    points.push(pt);
  }

  // Ensure last month is included if step > 1
  if (points.length > 0 && points[points.length - 1]!.month !== maxMonths) {
    const yr = Math.floor((maxMonths - 1) / 12) + 1;
    const mo = ((maxMonths - 1) % 12) + 1;
    const pt: UnifiedChartPoint = {
      month: maxMonths,
      label: maxMonths > 36 ? `Y${yr} M${mo}` : `M${maxMonths}`,
    };
    for (const s of scenarios) {
      pt[s.id] = getScenarioValueAtMonth(s, maxMonths, useRealValue);
    }
    points.push(pt);
  }

  return points;
}

/**
 * Extract value for a scenario at a specific month.
 */
function getScenarioValueAtMonth(
  scenario: PinnedScenario,
  month: number,
  useRealValue: boolean
): number {
  if (scenario.type === 'fdr') {
    const res = scenario.result as FdrResult;
    if (res.breakdown.length === 0) return 0;
    const idx = Math.min(month - 1, res.breakdown.length - 1);
    const row = res.breakdown[idx]!;
    return useRealValue ? row.realValue.toNumber() : row.netBalance.toNumber();
  }

  if (scenario.type === 'dps') {
    const res = scenario.result as DpsResult;
    if (res.breakdown.length === 0) return 0;
    const idx = Math.min(month - 1, res.breakdown.length - 1);
    const row = res.breakdown[idx]!;
    return useRealValue ? row.realValue.toNumber() : row.netBalance.toNumber();
  }

  if (scenario.type === 'emi') {
    const res = scenario.result as EmiResult;
    if (res.schedule.length === 0) return 0;
    // For EMI, show outstanding balance or cumulative interest paid
    const idx = Math.min(month - 1, res.schedule.length - 1);
    const row = res.schedule[idx]!;
    return row.outstandingBalance.toNumber();
  }

  return 0;
}

export interface ComparisonWinner {
  winnerId: string | null;
  badgeLabel: string;
  reason: string;
}

/**
 * Automatically determine the top-performing scenario.
 */
export function determineWinner(scenarios: PinnedScenario[]): ComparisonWinner {
  if (scenarios.length === 0) {
    return { winnerId: null, badgeLabel: '', reason: '' };
  }

  if (scenarios.length === 1) {
    return { winnerId: scenarios[0]!.id, badgeLabel: 'Active Scenario', reason: 'Single scenario pinned' };
  }

  // Check if all are investments (FDR or DPS)
  const allInvestments = scenarios.every((s) => s.type === 'fdr' || s.type === 'dps');
  if (allInvestments) {
    let bestYield = new Decimal(-Infinity);
    let bestId: string | null = null;

    for (const s of scenarios) {
      let effYield = new Decimal(0);

      if (s.type === 'fdr') {
        const r = s.result as FdrResult;
        effYield = r.netEffectiveYieldPct;
      } else if (s.type === 'dps') {
        const r = s.result as DpsResult;
        // Approximate annualized return for DPS
        if (!r.totalDeposited.isZero()) {
          effYield = r.netInterest.div(r.totalDeposited).mul(100);
        }
      }

      if (effYield.gt(bestYield)) {
        bestYield = effYield;
        bestId = s.id;
      }
    }

    return {
      winnerId: bestId,
      badgeLabel: 'Top Net Yield 🏆',
      reason: `Delivers highest annualized return (${bestYield.toFixed(2)}%)`,
    };
  }

  // Check if all are loans (EMI)
  const allLoans = scenarios.every((s) => s.type === 'emi');
  if (allLoans) {
    let lowestInterest = new Decimal(Infinity);
    let bestId: string | null = null;

    for (const s of scenarios) {
      const r = s.result as EmiResult;
      if (r.totalInterestWithPrepayment.lt(lowestInterest)) {
        lowestInterest = r.totalInterestWithPrepayment;
        bestId = s.id;
      }
    }

    return {
      winnerId: bestId,
      badgeLabel: 'Lowest Total Cost 🏆',
      reason: 'Minimizes lifetime interest paid',
    };
  }

  // Mixed scenarios (e.g. Loan Prepayment vs DPS Investment)
  return {
    winnerId: scenarios[0]!.id,
    badgeLabel: 'Comparison Active',
    reason: 'Multi-asset comparison across debt & savings',
  };
}
