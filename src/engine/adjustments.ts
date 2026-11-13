/**
 * FinLens Engine — Adjustment Utilities
 *
 * Pure helper functions for inflation discounting, tax application,
 * and currency formatting. Used across all calculator modules.
 */
import Decimal from 'decimal.js';

/**
 * Discount a future nominal value to its present purchasing power.
 *
 * Formula: realValue = nominalValue / (1 + inflationRate)^years
 */
export function discountByInflation(
  nominalValue: Decimal,
  annualInflationPct: Decimal,
  years: Decimal
): Decimal {
  if (annualInflationPct.isZero()) return nominalValue;
  const inflationRate = annualInflationPct.div(100);
  return nominalValue.div(
    Decimal.add(1, inflationRate).pow(years)
  );
}

/**
 * Apply tax on interest and return { taxAmount, netAmount }.
 */
export function applyTax(
  grossAmount: Decimal,
  principal: Decimal,
  taxPct: Decimal
): { interest: Decimal; taxAmount: Decimal; netAmount: Decimal } {
  const interest = grossAmount.sub(principal);
  const taxRate = taxPct.div(100);
  const taxAmount = interest.mul(taxRate);
  const netAmount = grossAmount.sub(taxAmount);
  return { interest, taxAmount, netAmount };
}

/**
 * Deduct annual fees from a value based on years elapsed.
 */
export function deductFees(
  value: Decimal,
  annualFee: Decimal,
  yearsElapsed: number
): Decimal {
  return value.sub(annualFee.mul(yearsElapsed));
}

// ─── Bangladesh Excise Duty (FY 2026-27 Tiered Schedule) ───────

export const BD_EXCISE_TIERS = [
  { max: new Decimal(400000), duty: new Decimal(0), label: 'Up to ৳4 Lakh' },
  { max: new Decimal(500000), duty: new Decimal(150), label: '৳4,00,001 – ৳5,00,000' },
  { max: new Decimal(1000000), duty: new Decimal(500), label: '৳5,00,001 – ৳10,00,000' },
  { max: new Decimal(5000000), duty: new Decimal(3000), label: '৳10,00,001 – ৳50,00,000' },
  { max: new Decimal(10000000), duty: new Decimal(5000), label: '৳50,00,001 – ৳1,00,00,000' },
  { max: null, duty: new Decimal(10000), label: 'Above ৳1,00,00,000' },
] as const;

/**
 * Calculate annual Bangladesh Bank Excise Duty based on peak account balance.
 * Uses exact FY 2026-27 NBR slabs:
 * - Up to 4,00,000: 0
 * - 4,00,001 to 5,00,000: 150/yr
 * - 5,00,001 to 10,00,000: 500/yr
 * - 10,00,001 to 50,00,000: 3,000/yr
 * - 50,00,001 to 1,00,00,000: 5,000/yr
 * - Above 1,00,00,000: 10,000/yr
 */
export function calculateBdExciseDuty(balance: Decimal): Decimal {
  if (balance.lte(400000)) return new Decimal(0);
  if (balance.lte(500000)) return new Decimal(150);
  if (balance.lte(1000000)) return new Decimal(500);
  if (balance.lte(5000000)) return new Decimal(3000);
  if (balance.lte(10000000)) return new Decimal(5000);
  return new Decimal(10000);
}

/**
 * Returns the Source Tax / AIT percentage based on TIN / PSR submission:
 * - 10% with TIN / Proof of Submission of Return (PSR)
 * - 15% without TIN
 */
export function getTaxRateForTin(hasTin: boolean): Decimal {
  return hasTin ? new Decimal(10) : new Decimal(15);
}

/**
 * Smart Split Optimizer:
 * Analyzes whether splitting a balance across 2 separate accounts or family members
 * drops the account into a lower excise duty bracket, saving money every year.
 */
export function detectSplitSavings(
  maxBalance: Decimal,
  tenureYears: number,
  symbol: string = '৳'
): import('./types').SplitSavingsTip {
  const originalExcise = calculateBdExciseDuty(maxBalance);

  // Split into 2 equal accounts
  const halfBalance = maxBalance.div(2);
  const halfExcise = calculateBdExciseDuty(halfBalance);
  const splitExcise = halfExcise.mul(2);

  const annualSavings = originalExcise.sub(splitExcise);
  const years = Math.max(1, Math.round(tenureYears));
  const totalSavingsOverTenure = annualSavings.mul(years);

  if (annualSavings.gt(0)) {
    const formattedHalf = `${symbol}${formatCompact(halfBalance, 'south-asian')}`;
    return {
      canSave: true,
      originalExcisePerYear: originalExcise,
      splitExcisePerYear: splitExcise,
      annualSavings,
      totalSavingsOverTenure,
      recommendedSplit: `2 × ${formattedHalf}`,
      description: `Splitting this deposit into two separate accounts (${formattedHalf} each) drops your excise bracket from ${symbol}${originalExcise.toNumber().toLocaleString()}/yr to ${symbol}${splitExcise.toNumber().toLocaleString()}/yr, saving ${symbol}${annualSavings.toNumber().toLocaleString()} annually (${symbol}${totalSavingsOverTenure.toNumber().toLocaleString()} over ${years} yrs).`,
    };
  }

  return {
    canSave: false,
    originalExcisePerYear: originalExcise,
    splitExcisePerYear: originalExcise,
    annualSavings: new Decimal(0),
    totalSavingsOverTenure: new Decimal(0),
    recommendedSplit: '',
    description: 'Your balance is already in the optimal excise duty bracket.',
  };
}

// ─── Currency Formatting ────────────────────────────────────────

export type NumberSystem = 'south-asian' | 'international';

export interface CurrencyConfig {
  symbol: string;
  locale: string;
  numberSystem: NumberSystem;
}

export const CURRENCY_PRESETS: Record<string, CurrencyConfig> = {
  BDT: { symbol: '৳', locale: 'en-BD', numberSystem: 'south-asian' },
  INR: { symbol: '₹', locale: 'en-IN', numberSystem: 'south-asian' },
  USD: { symbol: '$', locale: 'en-US', numberSystem: 'international' },
  EUR: { symbol: '€', locale: 'en-DE', numberSystem: 'international' },
  GBP: { symbol: '£', locale: 'en-GB', numberSystem: 'international' },
};

/**
 * Format a Decimal value for display using the configured currency.
 * This is the ONLY place where Decimal → string conversion should happen.
 */
export function formatCurrency(
  value: Decimal,
  config: CurrencyConfig = CURRENCY_PRESETS['BDT']!
): string {
  const num = value.toNumber();

  if (config.numberSystem === 'south-asian') {
    return `${config.symbol}${formatSouthAsian(num)}`;
  }

  return `${config.symbol}${num.toLocaleString(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format number in South Asian notation (Lakh/Crore).
 * e.g. 12,34,567.89
 */
function formatSouthAsian(num: number): string {
  const isNeg = num < 0;
  const absNum = Math.abs(num);
  const [intPart, decPart] = absNum.toFixed(2).split('.');

  if (!intPart) return `0.${decPart ?? '00'}`;

  // South Asian grouping: last 3 digits, then groups of 2
  if (intPart.length <= 3) {
    return `${isNeg ? '-' : ''}${intPart}.${decPart ?? '00'}`;
  }

  const lastThree = intPart.slice(-3);
  const remaining = intPart.slice(0, -3);
  const grouped = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNeg ? '-' : ''}${grouped},${lastThree}.${decPart ?? '00'}`;
}

/**
 * Format a Decimal as a compact display string (e.g. "12.5L", "1.2Cr", "1.5M").
 */
export function formatCompact(
  value: Decimal,
  numberSystem: NumberSystem = 'south-asian'
): string {
  const num = value.toNumber();
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (numberSystem === 'south-asian') {
    if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(2)}L`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
    return `${sign}${abs.toFixed(2)}`;
  }

  // International
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${abs.toFixed(2)}`;
}
