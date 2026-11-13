import { Sparkles, TrendingUp, Building2, Landmark, Home, ArrowRight } from 'lucide-react';
import { type CalculatorTab } from '@/features/single/SingleCalculatorView';
import { useScenarios } from '@/state/scenarios';

export interface MarketPreset {
  id: string;
  name: string;
  rateLabel: string;
  tab: CalculatorTab;
  description: string;
  icon: typeof TrendingUp;
  badge?: string;
  data: {
    // FDR
    principal?: number;
    fdrRate?: number;
    fdrMonths?: number;
    fdrCompounding?: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly' | 'simple';
    // DPS
    dpsMonthly?: number;
    dpsRate?: number;
    dpsMonths?: number;
    dpsStepUp?: number;
    // EMI
    emiPrincipal?: number;
    emiRate?: number;
    emiMonths?: number;
    emiExtraMonthly?: number;
  };
}

export const MARKET_PRESETS: MarketPreset[] = [
  {
    id: 'fdr-high',
    name: 'High-Yield FDR',
    rateLabel: '~10.5%',
    tab: 'fdr',
    description: '1-Year Top Commercial Bank Fixed Deposit (৳1 Lakh @ 10.5%)',
    icon: Landmark,
    badge: 'Popular',
    data: {
      principal: 100000,
      fdrRate: 10.5,
      fdrMonths: 12,
      fdrCompounding: 'quarterly',
    },
  },
  {
    id: 'dps-std',
    name: 'Standard DPS',
    rateLabel: '~9.5%',
    tab: 'dps',
    description: '10-Year Wealth Builder Deposit Scheme (৳5K/mo @ 9.5%)',
    icon: TrendingUp,
    badge: 'Best Growth',
    data: {
      dpsMonthly: 5000,
      dpsRate: 9.5,
      dpsMonths: 120,
      dpsStepUp: 10,
    },
  },
  {
    id: 'sanchaya',
    name: 'Sanchayapatra',
    rateLabel: '~11.52%',
    tab: 'fdr',
    description: '5-Year Bangladesh National Savings Certificate (৳5 Lakh @ 11.52%)',
    icon: Building2,
    badge: 'Govt Backed',
    data: {
      principal: 500000,
      fdrRate: 11.52,
      fdrMonths: 60,
      fdrCompounding: 'monthly',
    },
  },
  {
    id: 'emi-home',
    name: 'Home Loan EMI',
    rateLabel: '~13.5%',
    tab: 'emi',
    description: '20-Year Home Mortgage with Prepayment Accelerator (৳50 Lakh @ 13.5%)',
    icon: Home,
    badge: 'Real Estate',
    data: {
      emiPrincipal: 5000000,
      emiRate: 13.5,
      emiMonths: 240,
      emiExtraMonthly: 5000,
    },
  },
];

interface MarketPresetsBarProps {
  onSelectPreset: (preset: MarketPreset) => void;
  activePresetId?: string;
}

export function MarketPresetsBar({ onSelectPreset, activePresetId }: MarketPresetsBarProps) {
  const { setActiveView } = useScenarios();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-card/60 border border-border/70 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Market Benchmarks:
          </span>
          <span className="text-xs font-semibold text-foreground hidden sm:block">
            1-Click Real World Scenarios
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {MARKET_PRESETS.map((p) => {
          const Icon = p.icon;
          const isActive = activePresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]'
                  : 'bg-muted/40 hover:bg-muted text-foreground/90 border-border/60 hover:border-primary/40'
              }`}
              title={p.description}
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span>{p.name}</span>
              <span className={`font-mono text-[11px] px-1.5 py-0.2 rounded-md ${
                isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary font-bold'
              }`}>
                {p.rateLabel}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveView('advisor')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition-all sm:ml-auto shrink-0 shadow-sm"
          title="View comprehensive bank rates and smart recommendations"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>All Bank Rates & Advisor</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
