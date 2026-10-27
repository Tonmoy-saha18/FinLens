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
