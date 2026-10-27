import React, { createContext, useContext, useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { calculateFdr } from '@/engine/fdr';
import { calculateDps } from '@/engine/dps';
import { calculateEmi } from '@/engine/emi';
import {
  type PinnedScenario,
  type ScenarioType,
} from '@/engine/comparison';

const PALETTE = [
  'hsl(245, 58%, 55%)', // Indigo/Primary
  'hsl(160, 60%, 45%)', // Emerald
  'hsl(35, 92%, 55%)',  // Amber
];

interface ScenariosContextType {
  pinnedScenarios: PinnedScenario[];
  pinScenario: (
    item: {
      name: string;
      type: ScenarioType;
      params: Record<string, any>;
      result: any;
    }
  ) => boolean;
  unpinScenario: (id: string) => void;
  updateScenarioName: (id: string, name: string) => void;
  clearAllScenarios: () => void;
  activeView: 'single' | 'arena';
  setActiveView: (view: 'single' | 'arena') => void;
  notification: string | null;
  loadPresetBattle: (presetId: 'fdr-war' | 'loan-prepay' | 'dps-tenure') => void;
}

const ScenariosContext = createContext<ScenariosContextType | null>(null);

export function ScenariosProvider({ children }: { children: React.ReactNode }) {
  const [pinnedScenarios, setPinnedScenarios] = useState<PinnedScenario[]>(() => {
    // Initial default: load FDR Rate War if empty for instant arena discovery
    return getFdrRateWarPreset();
  });

  const [activeView, setActiveView] = useState<'single' | 'arena'>('single');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const pinScenario = (item: {
    name: string;
    type: ScenarioType;
    params: Record<string, any>;
    result: any;
  }): boolean => {
    if (pinnedScenarios.length >= 3) {
      setNotification('Arena is full (max 3 scenarios). Remove one first.');
      return false;
    }

    const assignedColor = PALETTE[pinnedScenarios.length % PALETTE.length]!;
    const newScenario: PinnedScenario = {
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      type: item.type,
      color: assignedColor,
      params: item.params,
      result: item.result,
    };

    setPinnedScenarios((prev) => [...prev, newScenario]);
    setNotification(`Pinned "${item.name}" to Scenario Arena (${pinnedScenarios.length + 1}/3)`);
    return true;
  };

  const unpinScenario = (id: string) => {
    setPinnedScenarios((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      // Re-assign distinct colors
      return updated.map((s, idx) => ({
        ...s,
        color: PALETTE[idx % PALETTE.length]!,
      }));
    });
  };

  const updateScenarioName = (id: string, name: string) => {
    setPinnedScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const clearAllScenarios = () => {
    setPinnedScenarios([]);
    setNotification('Cleared all arena scenarios');
  };

  const loadPresetBattle = (presetId: 'fdr-war' | 'loan-prepay' | 'dps-tenure') => {
    if (presetId === 'fdr-war') {
      setPinnedScenarios(getFdrRateWarPreset());
    } else if (presetId === 'loan-prepay') {
      setPinnedScenarios(getLoanPrepayPreset());
    } else if (presetId === 'dps-tenure') {
      setPinnedScenarios(getDpsTenurePreset());
    }
    setActiveView('arena');
    setNotification(`Loaded battle preset!`);
  };

  return (
    <ScenariosContext.Provider
      value={{
        pinnedScenarios,
        pinScenario,
        unpinScenario,
        updateScenarioName,
        clearAllScenarios,
        activeView,
        setActiveView,
        notification,
        loadPresetBattle,
      }}
    >
      {children}
    </ScenariosContext.Provider>
  );
}

export function useScenarios() {
  const ctx = useContext(ScenariosContext);
  if (!ctx) throw new Error('useScenarios must be used within ScenariosProvider');
  return ctx;
}

// ─── Preset Battle Builders ─────────────────────────────────────

function getFdrRateWarPreset(): PinnedScenario[] {
  const fdrA = calculateFdr({
    principal: new Decimal(500000),
    annualRatePct: new Decimal(9.0),
    tenureMonths: 36,
    compounding: 'monthly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(6),
  });

  const fdrB = calculateFdr({
    principal: new Decimal(500000),
    annualRatePct: new Decimal(10.2),
    tenureMonths: 36,
    compounding: 'quarterly',
    taxPct: new Decimal(15),
    annualFee: new Decimal(1000),
    inflationPct: new Decimal(6),
  });

  return [
    {
      id: 'sc_fdr_a',
      name: 'Bank A: 9.0% (Low Tax/Fee)',
      type: 'fdr',
      color: PALETTE[0]!,
      params: { principal: 500000, rate: 9.0, months: 36, tax: 10, fee: 0 },
      result: fdrA,
    },
    {
      id: 'sc_fdr_b',
      name: 'Bank B: 10.2% (High Tax/Fee)',
      type: 'fdr',
      color: PALETTE[1]!,
      params: { principal: 500000, rate: 10.2, months: 36, tax: 15, fee: 1000 },
      result: fdrB,
    },
  ];
}

function getLoanPrepayPreset(): PinnedScenario[] {
  const emiStandard = calculateEmi({
    loanPrincipal: new Decimal(4000000),
    annualRatePct: new Decimal(9.5),
    tenureMonths: 180,
    extraMonthlyPrepayment: new Decimal(0),
    yearlyLumpSumPrepayment: new Decimal(0),
  });

  const emiPrepaid = calculateEmi({
    loanPrincipal: new Decimal(4000000),
    annualRatePct: new Decimal(9.5),
    tenureMonths: 180,
    extraMonthlyPrepayment: new Decimal(5000),
    yearlyLumpSumPrepayment: new Decimal(25000),
  });

  return [
    {
      id: 'sc_loan_std',
      name: 'Standard 15-Yr Home Loan',
      type: 'emi',
      color: PALETTE[0]!,
      params: { principal: 4000000, rate: 9.5, months: 180 },
      result: emiStandard,
    },
    {
      id: 'sc_loan_prep',
      name: 'Accelerated (+৳5K/mo Prepay)',
      type: 'emi',
      color: PALETTE[1]!,
      params: { principal: 4000000, rate: 9.5, months: 180, extraMonthly: 5000, yearlyLump: 25000 },
      result: emiPrepaid,
    },
  ];
}

function getDpsTenurePreset(): PinnedScenario[] {
  const dpsA = calculateDps({
    monthlyInstallment: new Decimal(10000),
    annualRatePct: new Decimal(9.5),
    tenureYears: 5,
    compounding: 'monthly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(6),
  });

  const dpsB = calculateDps({
    monthlyInstallment: new Decimal(5000),
    annualRatePct: new Decimal(9.5),
    tenureYears: 10,
    compounding: 'monthly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(6),
  });

  const dpsC = calculateDps({
    monthlyInstallment: new Decimal(3000),
    annualRatePct: new Decimal(10.0),
    tenureYears: 15,
    compounding: 'quarterly',
    taxPct: new Decimal(10),
    annualFee: new Decimal(0),
    inflationPct: new Decimal(6),
  });

  return [
    {
      id: 'sc_dps_5',
      name: 'Sprint: ৳10K/mo × 5 Yr',
      type: 'dps',
      color: PALETTE[0]!,
      params: { monthly: 10000, years: 5, rate: 9.5 },
      result: dpsA,
    },
    {
      id: 'sc_dps_10',
      name: 'Steady: ৳5K/mo × 10 Yr',
      type: 'dps',
      color: PALETTE[1]!,
      params: { monthly: 5000, years: 10, rate: 9.5 },
      result: dpsB,
    },
    {
      id: 'sc_dps_15',
      name: 'Compounding: ৳3K/mo × 15 Yr',
      type: 'dps',
      color: PALETTE[2]!,
      params: { monthly: 3000, years: 15, rate: 10.0 },
      result: dpsC,
    },
  ];
}
