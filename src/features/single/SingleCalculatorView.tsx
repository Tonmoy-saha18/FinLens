import { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  CreditCard,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { FdrCalculator } from './FdrCalculator';
import { DpsCalculator } from './DpsCalculator';
import { EmiCalculator } from './EmiCalculator';
import { MarketPresetsBar, type MarketPreset } from '@/components/MarketPresetsBar';
import { useScenarios } from '@/state/scenarios';

export type CalculatorTab = 'fdr' | 'dps' | 'emi';

export function SingleCalculatorView() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('fdr');
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();
  const { calculatorLoadRequest, loadIntoCalculator, setActiveView } = useScenarios();

  useEffect(() => {
    if (calculatorLoadRequest) {
      setActiveTab(calculatorLoadRequest.tab);
    }
  }, [calculatorLoadRequest]);

  const handleSelectMarketPreset = (preset: MarketPreset) => {
    setSelectedPresetId(preset.id);
    setActiveTab(preset.tab);
    loadIntoCalculator({
      tab: preset.tab,
      params: {
        principal: preset.data.principal,
        annualRate: preset.data.fdrRate || preset.data.dpsRate || preset.data.emiRate,
        tenureMonths: preset.data.fdrMonths || preset.data.dpsMonths || preset.data.emiMonths,
        compounding: preset.data.fdrCompounding,
        monthlyInstallment: preset.data.dpsMonthly,
        stepUpPercent: preset.data.dpsStepUp,
        loanPrincipal: preset.data.emiPrincipal,
        extraMonthly: preset.data.emiExtraMonthly,
      },
      schemeName: preset.name,
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick-Fill Market Benchmarks Bar */}
      <MarketPresetsBar
        onSelectPreset={handleSelectMarketPreset}
        activePresetId={selectedPresetId}
      />

      {/* Advisor Quick Link Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary/[0.08] via-background to-background border border-primary/25 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-foreground block sm:text-xs">
              Unsure which bank or investment scheme to choose?
            </span>
            <span className="text-muted-foreground text-[11px]">
              Compare 11.52% Sanchayapatra vs BRAC, City, EBL, DBBL & IDLC with institutional credit safety & inflation checks.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveView('advisor')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity self-start sm:self-auto shrink-0 shadow-sm shadow-primary/25 text-xs"
        >
          <span>Bank Rates Directory & Advisor</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

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
