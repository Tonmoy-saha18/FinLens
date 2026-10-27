/**
 * FinLens Engine — Barrel Export
 */
export { calculateFdr } from './fdr';
export { calculateDps } from './dps';
export { calculateEmi } from './emi';
export {
  discountByInflation,
  applyTax,
  deductFees,
  formatCurrency,
  formatCompact,
  CURRENCY_PRESETS,
} from './adjustments';
export type {
  FdrInput,
  FdrResult,
  FdrPeriodBreakdown,
  DpsInput,
  DpsResult,
  DpsPeriodBreakdown,
  EmiInput,
  EmiResult,
  EmiAmortizationRow,
  CompoundingFrequency,
} from './types';
export { compoundingPeriodsPerYear } from './types';
