import { useState } from 'react';
import {
  Wallet,
  Coins,
  CreditCard,
} from 'lucide-react';
import { FdrCalculator } from './FdrCalculator';
import { DpsCalculator } from './DpsCalculator';
import { EmiCalculator } from './EmiCalculator';
import { MarketPresetsBar, type MarketPreset } from '@/components/MarketPresetsBar';

export type CalculatorTab = 'fdr' | 'dps' | 'emi';

export function SingleCalculatorView() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('fdr');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  const handleSelectMarketPreset = (preset: MarketPreset) => {
    setSelectedPresetId(preset.id);
    setActiveTab(preset.tab);
  };

  return (
    <div className="space-y-6">
      {/* Quick-Fill Market Benchmarks Bar */}
      <MarketPresetsBar
        onSelectPreset={handleSelectMarketPreset}
        activePresetId={selectedPresetId}
      />

      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60 self-start">
          <button
            onClick={() => {
              setActiveTab('fdr');
              setSelectedPresetId(undefined);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'fdr'
                ? 'bg-background text-foreground shadow-sm shadow-black/5 font-bold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>FDR / Fixed Deposit</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('dps');
              setSelectedPresetId(undefined);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'dps'
                ? 'bg-background text-foreground shadow-sm shadow-black/5 font-bold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>DPS / Recurring</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('emi');
              setSelectedPresetId(undefined);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              activeTab === 'emi'
                ? 'bg-background text-foreground shadow-sm shadow-black/5 font-bold text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>EMI & Prepayment</span>
          </button>
        </div>

        {/* Real-time UX indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Calculation</span>
        </div>
      </div>

      {/* Calculator Body */}
      <div className="pt-1">
        {activeTab === 'fdr' && <FdrCalculator />}
        {activeTab === 'dps' && <DpsCalculator />}
        {activeTab === 'emi' && <EmiCalculator />}
      </div>
    </div>
  );
}
