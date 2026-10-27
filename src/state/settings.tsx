import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  CURRENCY_PRESETS,
  type CurrencyConfig,
  type NumberSystem,
  formatCurrency,
  formatCompact,
} from '@/engine/adjustments';

interface SettingsContextType {
  currencyCode: string;
  setCurrencyCode: (code: string) => void;
  currencyConfig: CurrencyConfig;
  numberSystem: NumberSystem;
  setNumberSystem: (system: NumberSystem) => void;
  isDark: boolean;
  toggleTheme: () => void;
  formatMoney: (val: Decimal | number) => string;
  formatShort: (val: Decimal | number) => string;
  symbol: string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEYS = {
  CURRENCY: 'finlens_currency',
  NUMBER_SYSTEM: 'finlens_number_system',
  THEME: 'finlens_theme',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currencyCode, setCurrencyCodeState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'BDT';
  });

  const [numberSystem, setNumberSystemState] = useState<NumberSystem>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NUMBER_SYSTEM);
    return saved === 'international' || saved === 'south-asian' ? saved : 'south-asian';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDark]);

  const setCurrencyCode = (code: string) => {
    if (CURRENCY_PRESETS[code]) {
      setCurrencyCodeState(code);
      localStorage.setItem(STORAGE_KEYS.CURRENCY, code);
      // Auto-set matching number system if user changes currency to USD/EUR/GBP
      if (code === 'USD' || code === 'EUR' || code === 'GBP') {
        setNumberSystemState('international');
        localStorage.setItem(STORAGE_KEYS.NUMBER_SYSTEM, 'international');
      } else if (code === 'BDT' || code === 'INR') {
        setNumberSystemState('south-asian');
        localStorage.setItem(STORAGE_KEYS.NUMBER_SYSTEM, 'south-asian');
      }
    }
  };

  const setNumberSystem = (system: NumberSystem) => {
    setNumberSystemState(system);
    localStorage.setItem(STORAGE_KEYS.NUMBER_SYSTEM, system);
  };

  const toggleTheme = () => setIsDark((prev) => !prev);

  const baseConfig = CURRENCY_PRESETS[currencyCode] || CURRENCY_PRESETS['BDT']!;
  const currencyConfig: CurrencyConfig = useMemo(
    () => ({
      ...baseConfig,
      numberSystem,
    }),
    [baseConfig, numberSystem]
  );

  const formatMoney = (val: Decimal | number) => {
    const dec = val instanceof Decimal ? val : new Decimal(val);
    return formatCurrency(dec, currencyConfig);
  };

  const formatShort = (val: Decimal | number) => {
    const dec = val instanceof Decimal ? val : new Decimal(val);
    return `${currencyConfig.symbol}${formatCompact(dec, numberSystem)}`;
  };

  return (
    <SettingsContext.Provider
      value={{
        currencyCode,
        setCurrencyCode,
        currencyConfig,
        numberSystem,
        setNumberSystem,
        isDark,
        toggleTheme,
        formatMoney,
        formatShort,
        symbol: currencyConfig.symbol,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
