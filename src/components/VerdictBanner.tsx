import Decimal from 'decimal.js';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Scissors,
  CheckCircle2,
  ShieldAlert,
  Flame,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { type SplitSavingsTip, type FdrResult, type DpsResult, type EmiResult } from '@/engine/types';
import { type PinnedScenario } from '@/state/scenarios';
import { useSettings } from '@/state/settings';

interface SingleVerdictProps {
  mode: 'single';
  type: 'fdr' | 'dps' | 'emi';
  result: FdrResult | DpsResult | EmiResult;
  splitSavingsTip?: SplitSavingsTip;
}

interface ArenaVerdictProps {
  mode: 'arena';
  scenarios: PinnedScenario[];
}

export type VerdictBannerProps = SingleVerdictProps | ArenaVerdictProps;

export function VerdictBanner(props: VerdictBannerProps) {
  const { formatMoney, symbol } = useSettings();

  if (props.mode === 'arena') {
    return <ArenaVerdictCard scenarios={props.scenarios} formatMoney={formatMoney} symbol={symbol} />;
  }

  const { type, result, splitSavingsTip } = props;

  if (type === 'emi') {
    return <EmiVerdictCard result={result as EmiResult} formatMoney={formatMoney} symbol={symbol} />;
  }

  return (
    <DepositVerdictCard
      type={type}
      result={result as FdrResult | DpsResult}
      splitSavingsTip={splitSavingsTip}
      formatMoney={formatMoney}
      symbol={symbol}
    />
  );
}

// ─── Deposit (FDR / DPS) Verdict Card ───────────────────────────

function DepositVerdictCard({
  type,
  result,
  splitSavingsTip,
  formatMoney,
  symbol,
}: {
  type: 'fdr' | 'dps';
  result: FdrResult | DpsResult;
  splitSavingsTip?: SplitSavingsTip;
  formatMoney: (v: Decimal | number) => string;
  symbol: string;
}) {
  const principal = 'principal' in result ? result.principal : result.totalDeposited;
  const netMaturity = result.netMaturity;
  const realValue = result.realPurchasingPower;
  const totalTax = result.totalTax;
  const totalFees = result.totalFees;

  // Inflation erosion = Nominal Net Maturity - Real Purchasing Power
  const inflationLoss = netMaturity.gt(realValue) ? netMaturity.sub(realValue) : new Decimal(0);
  // Total Leakage = Tax + Excise Duty/Fees + Inflation Purchasing Power Loss
  const totalLeakage = totalTax.add(totalFees).add(inflationLoss);

  // Real wealth creation
  const isRealPositive = realValue.gte(principal);
  const realNetGain = isRealPositive ? realValue.sub(principal) : principal.sub(realValue);

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.07] via-background to-background p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Smart Advisor Verdict
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-1.5">
              {isRealPositive ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 inline" />
                  <span>Beating Inflation: Real purchasing gain of {formatMoney(realNetGain)}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 inline" />
                  <span>Inflation Warning: Purchasing power loses {formatMoney(realNetGain)} in real terms</span>
                </>
              )}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/80 border border-border/60">
          <span className="text-muted-foreground">{type === 'fdr' ? 'FDR Scheme' : 'DPS Scheme'}</span>
          <span className="text-foreground">Net: {formatMoney(netMaturity)}</span>
        </div>
      </div>

      {/* Quantified Leakage Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-red-500" />
            Source Tax (AIT)
          </span>
          <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono mt-0.5 block">
            -{formatMoney(totalTax)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
            <Flame className="h-3 w-3 text-amber-500" />
            Excise & Fees
          </span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
            -{formatMoney(totalFees)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-indigo-500" />
            Inflation Erosion
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 block">
            -{formatMoney(inflationLoss)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
          <span className="text-[10px] uppercase font-bold text-destructive">
            Total Wealth Leakage
          </span>
          <span className="text-sm font-extrabold text-destructive font-mono mt-0.5 block">
            -{formatMoney(totalLeakage)}
          </span>
        </div>
      </div>

      {/* Smart Split Optimizer Alert (If splitting saves excise duty) */}
      {splitSavingsTip && splitSavingsTip.canSave && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Smart Split Optimizer: Save {symbol}{splitSavingsTip.annualSavings.toNumber().toLocaleString()}/yr
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  Recommended: {splitSavingsTip.recommendedSplit}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {splitSavingsTip.description}
              </p>
            </div>
          </div>

          <div className="font-mono font-bold text-right shrink-0">
            <span className="text-[10px] text-muted-foreground block uppercase">Tenure Total Savings</span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              +{formatMoney(splitSavingsTip.totalSavingsOverTenure)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── EMI Loan Verdict Card ──────────────────────────────────────

function EmiVerdictCard({
  result,
  formatMoney,
}: {
  result: EmiResult;
  formatMoney: (v: Decimal | number) => string;
  symbol: string;
}) {
  const hasPrepayment = result.interestSaved.gt(0);
  const yearsSaved = (result.monthsSaved / 12).toFixed(1);

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/[0.07] via-background to-background p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Loan Advisor Verdict
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground">
              {hasPrepayment ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  Prepayment Accelerator: Save {formatMoney(result.interestSaved)} & clear loan {yearsSaved} years earlier!
                </span>
              ) : (
                <span>
                  Standard Payoff: You will pay {formatMoney(result.totalInterestWithoutPrepayment)} in total bank interest.
                </span>
              )}
            </h4>
          </div>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted/80 border border-border/60">
          Monthly EMI: <span className="text-primary font-mono font-bold">{formatMoney(result.baseEmi)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground">Original Interest</span>
          <span className="text-sm font-bold text-foreground font-mono block mt-0.5">
            {formatMoney(result.totalInterestWithoutPrepayment)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-card border border-border/60">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground">Actual Interest with Prepayment</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
            {formatMoney(result.totalInterestWithPrepayment)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
            Total Interest Saved
          </span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
            {hasPrepayment ? `+${formatMoney(result.interestSaved)}` : '৳0 (Slide Prepayments to Save)'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Scenario Arena Comparison Verdict Card ─────────────────────

function ArenaVerdictCard({
  scenarios,
  formatMoney,
}: {
  scenarios: PinnedScenario[];
  formatMoney: (v: Decimal | number) => string;
  symbol: string;
}) {
  if (scenarios.length === 0) return null;

  if (scenarios.length === 1) {
    const s = scenarios[0]!;
    return (
      <div className="rounded-2xl border border-primary/30 bg-muted/20 p-4 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span>Pin 1 or 2 more scenarios to compare side-by-side with automated winner analysis!</span>
        </div>
        <span className="font-bold text-primary">{s.name}</span>
      </div>
    );
  }

  // Find winner (highest net take-home maturity)
  const sorted = [...scenarios].sort((a, b) => {
    const aVal = 'netMaturity' in a.result ? a.result.netMaturity : new Decimal(0);
    const bVal = 'netMaturity' in b.result ? b.result.netMaturity : new Decimal(0);
    return bVal.comparedTo(aVal);
  });

  const winner = sorted[0]!;
  const runnerUp = sorted[1]!;
  const winnerMaturity = 'netMaturity' in winner.result ? winner.result.netMaturity : new Decimal(0);
  const runnerUpMaturity = 'netMaturity' in runnerUp.result ? runnerUp.result.netMaturity : new Decimal(0);
  const diff = winnerMaturity.sub(runnerUpMaturity);

  return (
    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] via-background to-background p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Scenario Arena Winner
            </span>
            <h4 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <span>{winner.name}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-emerald-600 dark:text-emerald-400">
                +{formatMoney(diff)} more net wealth than {runnerUp.name}
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full text-amber-700 dark:text-amber-300">
          Winner Net: {formatMoney(winnerMaturity)}
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Comparing {scenarios.length} pinned financial schemes side-by-side. All values incorporate compound interest, source tax (AIT), bank excise duties, and inflation adjustments.
      </p>
    </div>
  );
}
