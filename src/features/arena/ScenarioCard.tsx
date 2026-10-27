import { useState } from 'react';
import Decimal from 'decimal.js';
import {
  Trophy,
  X,
  Edit2,
  Check,
  TrendingUp,
  Percent,
  Eye,
  CreditCard,
  Coins,
  Wallet,
} from 'lucide-react';
import { type PinnedScenario } from '@/engine/comparison';
import { type FdrResult, type DpsResult, type EmiResult } from '@/engine/types';
import { useSettings } from '@/state/settings';
import { Button } from '@/components/ui/button';

interface ScenarioCardProps {
  scenario: PinnedScenario;
  isWinner: boolean;
  winnerBadge?: string;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export function ScenarioCard({
  scenario,
  isWinner,
  winnerBadge = 'Top Net Yield 🏆',
  onRemove,
  onRename,
}: ScenarioCardProps) {
  const { formatMoney } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(scenario.name);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onRename(scenario.id, editedName.trim());
    }
    setIsEditing(false);
  };

  // Extract uniform metrics depending on scenario type
  const {
    badgeIcon: BadgeIcon,
    typeLabel,
    capitalOutlay,
    finalBalance,
    netReturn,
    yieldLabel,
    yieldValue,
    realValue,
  } = getScenarioMetrics(scenario, formatMoney);

  return (
    <div
      className={`glass-card rounded-2xl p-5 relative transition-all duration-300 flex flex-col justify-between ${
        isWinner
          ? 'ring-2 ring-emerald-500/60 shadow-xl shadow-emerald-500/10'
          : 'border border-border/70 hover:border-primary/40'
      }`}
    >
      {/* Top Banner if Winner */}
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <Trophy className="w-3 h-3 text-amber-300 animate-bounce" />
          <span>{winnerBadge}</span>
        </div>
      )}

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-2 pt-1 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: scenario.color }}
            />
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-muted text-muted-foreground flex items-center gap-1">
              <BadgeIcon className="w-3 h-3" />
              {typeLabel}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(scenario.id)}
            className="w-6 h-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
            aria-label="Remove scenario"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Editable Name */}
        <div className="mb-4">
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="text-sm font-bold bg-background border border-primary px-2 py-0.5 rounded-md focus:outline-none w-full"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveName}
                className="w-7 h-7 text-primary hover:bg-primary/10"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <h4 className="text-sm font-bold text-foreground truncate pr-2">
                {scenario.name}
              </h4>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                aria-label="Rename scenario"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Big Key Metric Display */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 mb-4">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">
            {scenario.type === 'emi' ? 'Total Loan Payment' : 'Net Maturity Value'}
          </span>
          <div className="text-xl font-extrabold font-mono text-foreground tabular-nums">
            {finalBalance}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <Eye className="w-3 h-3 text-amber-500" />
            <span>Real Purchasing Value:</span>
            <span className="font-semibold text-foreground/80 font-mono">{realValue}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              Capital Outlay
            </span>
            <span className="font-semibold font-mono tabular-nums">{capitalOutlay}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              {scenario.type === 'emi' ? 'Total Interest Paid' : 'Net Interest Earned'}
            </span>
            <span
              className={`font-semibold font-mono tabular-nums ${
                scenario.type === 'emi' ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {netReturn}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-500" />
              {yieldLabel}
            </span>
            <span className="font-bold text-primary font-mono tabular-nums">{yieldValue}</span>
          </div>
        </div>
      </div>

      {/* Footer Pill: Key Parameters */}
      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
        {Object.entries(scenario.params).map(([k, v]) => (
          <span key={k} className="bg-muted px-2 py-0.5 rounded font-mono">
            {k}: {String(v)}
          </span>
        ))}
      </div>
    </div>
  );
}

function getScenarioMetrics(scenario: PinnedScenario, formatMoney: (v: any) => string) {
  if (scenario.type === 'fdr') {
    const res = scenario.result as FdrResult;
    const profit = res.netMaturity.sub(res.principal);
    return {
      badgeIcon: Wallet,
      typeLabel: 'FDR Deposit',
      capitalOutlay: formatMoney(res.principal),
      finalBalance: formatMoney(res.netMaturity),
      netReturn: `+${formatMoney(profit)}`,
      yieldLabel: 'Net Annualized Yield',
      yieldValue: `${res.netEffectiveYieldPct.toFixed(2)}%`,
      realValue: formatMoney(res.realPurchasingPower),
    };
  }

  if (scenario.type === 'dps') {
    const res = scenario.result as DpsResult;
    return {
      badgeIcon: Coins,
      typeLabel: 'DPS Recurring',
      capitalOutlay: formatMoney(res.totalDeposited),
      finalBalance: formatMoney(res.netMaturity),
      netReturn: `+${formatMoney(res.netInterest)}`,
      yieldLabel: 'Wealth Multiplier',
      yieldValue: `${res.totalDeposited.isZero() ? '1.00' : res.netMaturity.div(res.totalDeposited).toFixed(2)}×`,
      realValue: formatMoney(res.realPurchasingPower),
    };
  }

  // EMI
  const res = scenario.result as EmiResult;
  const principal = res.schedule[0] ? res.schedule[0].outstandingBalance.add(res.schedule[0].principalPortion) : new Decimal(0);
  const totalPaid = res.totalInterestWithPrepayment.add(principal);
  return {
    badgeIcon: CreditCard,
    typeLabel: 'Loan EMI',
    capitalOutlay: formatMoney(principal),
    finalBalance: formatMoney(totalPaid),
    netReturn: formatMoney(res.totalInterestWithPrepayment),
    yieldLabel: 'Interest Saved via Prepayment',
    yieldValue: formatMoney(res.interestSaved),
    realValue: formatMoney(totalPaid),
  };
}
