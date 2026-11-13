import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  ShieldCheck,
  Search,
  ArrowRight,
  Coins,
  Wallet,
  CreditCard,
  Scale,
  Swords,
  ChevronDown,
  ChevronUp,
  Info,
  Award,
  Layers,
} from 'lucide-react';
import {
  BANK_SCHEMES,
  BANK_INSTITUTIONS,
  ADVISORY_PILLARS,
  getSmartRecommendation,
  type BankScheme,
} from '@/data/bankRates';
import { calculateFdr } from '@/engine/fdr';
import { calculateDps } from '@/engine/dps';
import { calculateEmi } from '@/engine/emi';
import { useSettings } from '@/state/settings';
import { useScenarios } from '@/state/scenarios';
import { Button } from '@/components/ui/button';

type TopPickProjection =
  | {
      type: 'fdr';
      amount: number;
      netMaturity: Decimal;
      grossInterest: Decimal;
      totalTax: Decimal;
      tenureDisplay: string;
    }
  | {
      type: 'dps';
      amount: number;
      netMaturity: Decimal;
      totalDeposited: Decimal;
      grossInterest: Decimal;
      tenureDisplay: string;
    }
  | {
      type: 'loan';
      amount: number;
      baseEmi: Decimal;
      totalInterest: Decimal;
      tenureDisplay: string;
    };

function renderSimulationBox(proj: TopPickProjection, formatMoney: (val: Decimal | number) => string) {
  if (proj.type === 'fdr') {
    return (
      <>
        <div className="p-3 rounded-xl bg-card border border-border/70">
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Deposit Capital</span>
          <span className="text-base font-extrabold text-foreground font-mono mt-0.5 block">
            {formatMoney(proj.amount)}
          </span>
          <span className="text-[11px] text-muted-foreground">Tenure: {proj.tenureDisplay}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70">
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Gross Interest Earned</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
            +{formatMoney(proj.grossInterest)}
          </span>
          <span className="text-[11px] text-muted-foreground">Tax (10%): -{formatMoney(proj.totalTax)}</span>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-primary uppercase text-[10px] font-black block">Net Take-Home Maturity</span>
          <span className="text-lg font-black text-primary font-mono mt-0.5 block">
            {formatMoney(proj.netMaturity)}
          </span>
          <span className="text-[10px] text-muted-foreground">After tax & fees</span>
        </div>
      </>
    );
  }

  if (proj.type === 'dps') {
    return (
      <>
        <div className="p-3 rounded-xl bg-card border border-border/70">
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Monthly Installment</span>
          <span className="text-base font-extrabold text-foreground font-mono mt-0.5 block">
            {formatMoney(proj.amount)}/mo
          </span>
          <span className="text-[11px] text-muted-foreground">Tenure: {proj.tenureDisplay}</span>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border/70">
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Total Deposited</span>
          <span className="text-base font-extrabold text-foreground font-mono mt-0.5 block">
            {formatMoney(proj.totalDeposited)}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            Profit: +{formatMoney(proj.grossInterest)}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <span className="text-primary uppercase text-[10px] font-black block">Net Maturity Payout</span>
          <span className="text-lg font-black text-primary font-mono mt-0.5 block">
            {formatMoney(proj.netMaturity)}
          </span>
          <span className="text-[10px] text-muted-foreground">Compound wealth creation</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-3 rounded-xl bg-card border border-border/70">
        <span className="text-muted-foreground uppercase text-[10px] font-bold block">Loan Principal</span>
        <span className="text-base font-extrabold text-foreground font-mono mt-0.5 block">
          {formatMoney(proj.amount)}
        </span>
        <span className="text-[11px] text-muted-foreground">Tenure: {proj.tenureDisplay}</span>
      </div>
      <div className="p-3 rounded-xl bg-card border border-border/70">
        <span className="text-muted-foreground uppercase text-[10px] font-bold block">Total Bank Interest</span>
        <span className="text-base font-extrabold text-destructive font-mono mt-0.5 block">
          {formatMoney(proj.totalInterest)}
        </span>
        <span className="text-[11px] text-muted-foreground">Prepay extra to cut interest</span>
      </div>
      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
        <span className="text-primary uppercase text-[10px] font-black block">Estimated Monthly EMI</span>
        <span className="text-lg font-black text-primary font-mono mt-0.5 block">
          {formatMoney(proj.baseEmi)}
        </span>
        <span className="text-[10px] text-muted-foreground">Excluding processing fee</span>
      </div>
    </>
  );
}

export function BankAdvisorView() {
  const { formatMoney, symbol } = useSettings();
  const { loadIntoCalculator, pinBankScheme } = useScenarios();

  // Wizard state for "Find My Best Plan"
  const [goal, setGoal] = useState<'fdr' | 'dps' | 'loan'>('fdr');
  const [priority, setPriority] = useState<'safety' | 'returns' | 'islamic' | 'balanced'>('safety');
  const [capitalTier, setCapitalTier] = useState<number>(500000); // ৳5 Lakh default

  // Directory filter state
  const [directoryTab, setDirectoryTab] = useState<'all' | 'fdr' | 'dps' | 'loan' | 'islamic' | 'govt'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rate-desc' | 'rate-asc' | 'safety' | 'name'>('rate-desc');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  // Expanded advisory pillar
  const [expandedPillarId, setExpandedPillarId] = useState<string | null>('safety-vs-yield');

  // Compute recommendation
  const recommendation = useMemo(() => {
    return getSmartRecommendation({ goal, priority, amount: capitalTier });
  }, [goal, priority, capitalTier]);

  // Compute quick projection for the top recommended scheme
  const topPickProjection: TopPickProjection = useMemo(() => {
    const s = recommendation.topPick;
    const def = s.calculatorDefaults;

    if (s.type === 'fdr') {
      const p = capitalTier > 0 ? capitalTier : (def.principal || 100000);
      const res = calculateFdr({
        principal: new Decimal(p),
        annualRatePct: new Decimal(def.annualRate),
        tenureMonths: def.tenureMonths,
        compounding: def.compounding || 'quarterly',
        taxPct: new Decimal(10),
        annualFee: new Decimal(0),
        inflationPct: new Decimal(6),
      });
      return {
        type: 'fdr',
        amount: p,
        netMaturity: res.netMaturity,
        grossInterest: res.grossInterest,
        totalTax: res.totalTax,
        tenureDisplay: `${(def.tenureMonths / 12).toFixed(0)} Years`,
      };
    }

    if (s.type === 'dps') {
      const m = capitalTier >= 10000 ? 10000 : 5000;
      const yrs = (def.tenureMonths || 60) / 12;
      const res = calculateDps({
        monthlyInstallment: new Decimal(m),
        annualRatePct: new Decimal(def.annualRate),
        tenureYears: yrs,
        compounding: def.compounding || 'monthly',
        annualStepUpPercent: new Decimal(0),
        taxPct: new Decimal(10),
        annualFee: new Decimal(0),
        inflationPct: new Decimal(6),
      });
      return {
        type: 'dps',
        amount: m,
        netMaturity: res.netMaturity,
        totalDeposited: res.totalDeposited,
        grossInterest: res.grossInterest,
        tenureDisplay: `${yrs} Years`,
      };
    }

    // Loan
    const lp = capitalTier >= 1000000 ? capitalTier : 5000000;
    const res = calculateEmi({
      loanPrincipal: new Decimal(lp),
      annualRatePct: new Decimal(def.annualRate),
      tenureMonths: def.tenureMonths || 240,
      extraMonthlyPrepayment: new Decimal(def.extraMonthly || 0),
      yearlyLumpSumPrepayment: new Decimal(0),
    });
    return {
      type: 'loan',
      amount: lp,
      baseEmi: res.baseEmi,
      totalInterest: res.totalInterestWithoutPrepayment,
      tenureDisplay: `${(def.tenureMonths || 240) / 12} Years`,
    };
  }, [recommendation, capitalTier]);

  // Filter schemes for Directory
  const filteredSchemes = useMemo(() => {
    return BANK_SCHEMES.filter((scheme) => {
      // Tab filter
      if (directoryTab === 'fdr' && scheme.type !== 'fdr') return false;
      if (directoryTab === 'dps' && scheme.type !== 'dps') return false;
      if (directoryTab === 'loan' && scheme.type !== 'loan') return false;
      if (directoryTab === 'islamic' && !scheme.isIslamic) return false;
      if (directoryTab === 'govt' && !scheme.isGovtBacked) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = scheme.schemeName.toLowerCase().includes(q);
        const matchesBank = scheme.bankName.toLowerCase().includes(q) || scheme.bankShort.toLowerCase().includes(q);
        const matchesHighlights = scheme.highlights.some((h) => h.toLowerCase().includes(q));
        if (!matchesName && !matchesBank && !matchesHighlights) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rate-desc') return b.headlineRate - a.headlineRate;
      if (sortBy === 'rate-asc') return a.headlineRate - b.headlineRate;
      if (sortBy === 'safety') return b.safetyScore - a.safetyScore;
      return a.schemeName.localeCompare(b.schemeName);
    });
  }, [directoryTab, searchQuery, sortBy]);

  const handleLoadScheme = (scheme: BankScheme) => {
    loadIntoCalculator({
      tab: scheme.calculatorDefaults.tab,
      params: {
        principal: scheme.calculatorDefaults.principal,
        annualRate: scheme.calculatorDefaults.annualRate,
        tenureMonths: scheme.calculatorDefaults.tenureMonths,
        compounding: scheme.calculatorDefaults.compounding,
        monthlyInstallment: scheme.calculatorDefaults.monthlyInstallment,
        stepUpPercent: scheme.calculatorDefaults.stepUpPercent,
        loanPrincipal: scheme.calculatorDefaults.loanPrincipal,
        extraMonthly: scheme.calculatorDefaults.extraMonthly,
      },
      schemeName: `${scheme.bankShort}: ${scheme.schemeName}`,
      bankName: scheme.bankShort,
    });
  };

  const handlePinToArena = (scheme: BankScheme) => {
    pinBankScheme(scheme);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ── Macro Financial Pulse Bar ── */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Top FDR Rate
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">11.52%</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Govt Sanchaya</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">10.5%–11.0% in Top Banks</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Top DPS Rate
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-foreground">10.50%</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">BRAC / City / EBL</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Monthly compounding</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Lowest Home Loan
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">12.50%</span>
            <span className="text-[10px] text-muted-foreground font-semibold">DBBL</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">12.75% BRAC (0% prepay)</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Inflation Hurdle
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">~9.50%</span>
            <span className="text-[10px] text-amber-500 font-bold">CPI Rate</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Need &gt;10.5% for real gain</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Deposit Insurance
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black font-mono text-primary">৳2.00L</span>
            <span className="text-[10px] text-muted-foreground font-medium">BD Bank</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Per depositor cap</span>
        </div>
      </section>

      {/* ── SECTION 1: Interactive "Find My Best Plan" Wizard ── */}
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/[0.04] via-card to-card p-5 sm:p-7 shadow-lg shadow-primary/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Smart Advisor
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                Find Your Best Financial Plan in 3 Clicks
              </h2>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Factoring in institutional safety, source tax & inflation
          </span>
        </div>

        {/* Wizard Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1: Goal */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              1. Your Financial Goal:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setGoal('fdr')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  goal === 'fdr'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Lump Sum FDR
              </button>
              <button
                type="button"
                onClick={() => setGoal('dps')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  goal === 'dps'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly DPS
              </button>
              <button
                type="button"
                onClick={() => setGoal('loan')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  goal === 'loan'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Borrow Loan
              </button>
            </div>
          </div>

          {/* Step 2: Priority */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              2. Your Priority:
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-muted/60 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setPriority('safety')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  priority === 'safety'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Safety
              </button>
              <button
                type="button"
                onClick={() => setPriority('returns')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  priority === 'returns'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Max Yield
              </button>
              <button
                type="button"
                onClick={() => setPriority('islamic')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  priority === 'islamic'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Halal
              </button>
              <button
                type="button"
                onClick={() => setPriority('balanced')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all ${
                  priority === 'balanced'
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Balanced
              </button>
            </div>
          </div>

          {/* Step 3: Capital Budget */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              {goal === 'fdr' ? '3. Lump Sum Deposit:' : goal === 'dps' ? '3. Monthly Savings Budget:' : '3. Loan Requirement:'}
            </label>
            <div className="flex items-center gap-2">
              {goal === 'fdr' && (
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {[100000, 500000, 1500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapitalTier(amt)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        capitalTier === amt
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                          : 'bg-muted/40 border-border/70 text-foreground hover:bg-muted'
                      }`}
                    >
                      {symbol}{(amt / 100000).toFixed(0)} Lakh
                    </button>
                  ))}
                </div>
              )}
              {goal === 'dps' && (
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {[2500, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapitalTier(amt)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        capitalTier === amt
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                          : 'bg-muted/40 border-border/70 text-foreground hover:bg-muted'
                      }`}
                    >
                      {symbol}{amt.toLocaleString()}/mo
                    </button>
                  ))}
                </div>
              )}
              {goal === 'loan' && (
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {[1000000, 3000000, 5000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCapitalTier(amt)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                        capitalTier === amt
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                          : 'bg-muted/40 border-border/70 text-foreground hover:bg-muted'
                      }`}
                    >
                      {symbol}{(amt / 100000).toFixed(0)} Lakh
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Recommendation Result Card */}
        <div className="rounded-2xl border border-primary/40 bg-card p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wide border border-emerald-500/20">
                  ★ FinLens Top Recommended Plan
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-border/70">
                  {recommendation.topPick.bankShort}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                  {recommendation.topPick.creditRating}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                {recommendation.summaryTitle}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {recommendation.verdictExplanation}
              </p>
            </div>

            {/* Headline Rate */}
            <div className="sm:text-right shrink-0 p-3 sm:p-0 rounded-xl bg-muted/30 sm:bg-transparent">
              <span className="text-[11px] uppercase font-bold text-muted-foreground block">
                {recommendation.topPick.type === 'loan' ? 'Borrowing Rate' : 'Annual Return / Profit'}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-primary font-mono block mt-0.5">
                {recommendation.topPick.headlineRate}%
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {recommendation.topPick.rateType}
              </span>
            </div>
          </div>

          {/* Quick Engine Simulation Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {renderSimulationBox(topPickProjection, formatMoney)}
          </div>

          {/* Action Advice Callout */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-bold">Advisor Tip: </span>
              <span>{recommendation.actionAdvice}</span>
            </div>
          </div>

          {/* 1-Click Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Alternative runner-up:</span>
              <strong className="text-foreground">{recommendation.runnerUp.bankShort} ({recommendation.runnerUp.headlineRate}%)</strong>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePinToArena(recommendation.topPick)}
                className="text-xs font-semibold gap-1.5 rounded-xl border-border/80"
              >
                <Swords className="w-3.5 h-3.5 text-amber-500" />
                <span>Pin to Arena</span>
              </Button>
              <Button
                size="sm"
                onClick={() => handleLoadScheme(recommendation.topPick)}
                className="text-xs font-bold gap-1.5 rounded-xl shadow-md shadow-primary/20"
              >
                <span>Calculate & Customize in FinLens</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: "Which One is Worth Considering?" Strategic Guide ── */}
      <section className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <Scale className="w-4 h-4" />
            <span>Essential Decision Guide</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
            Which Scheme is Truly Worth Considering?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
            Brochure numbers don't tell the whole story. Here is what really impacts your wallet:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ADVISORY_PILLARS.map((pillar) => {
            const isExpanded = expandedPillarId === pillar.id;
            return (
              <div
                key={pillar.id}
                className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 ${
                  isExpanded
                    ? 'bg-card border-primary/50 shadow-md shadow-primary/5'
                    : 'bg-card/70 border-border/70 hover:border-border'
                }`}
              >
                <div
                  className="flex items-start justify-between gap-3 cursor-pointer"
                  onClick={() => setExpandedPillarId(isExpanded ? null : pillar.id)}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {pillar.badge}
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-foreground mt-1">
                      {pillar.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                    aria-label="Toggle details"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {pillar.summary}
                </p>

                {isExpanded && (
                  <div className="mt-4 pt-3 border-t border-border/60 space-y-3 animate-fade-in text-xs">
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15 font-semibold text-primary">
                      {pillar.keyRule}
                    </div>
                    <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                      {pillar.detailedPoints.map((pt, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 3: Comprehensive Bank Rates Directory ── */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Layers className="w-4 h-4" />
              <span>Full Bank Rates Directory</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Compare All Bank Schemes
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filter by product type, search by bank, or sort by rates to find the exact plan for your goals.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bank or scheme..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-card border border-border/70 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-44 sm:w-56"
              />
            </div>

            <div className="flex items-center bg-card rounded-xl border border-border/70 px-2 py-1">
              <span className="text-[11px] text-muted-foreground font-semibold mr-1.5">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                aria-label="Sort schemes"
              >
                <option value="rate-desc" className="bg-background text-foreground">Highest Rate</option>
                <option value="rate-asc" className="bg-background text-foreground">Lowest Rate</option>
                <option value="safety" className="bg-background text-foreground">Safety Score</option>
                <option value="name" className="bg-background text-foreground">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/60 self-start text-xs font-semibold">
          {[
            { id: 'all', label: 'All Schemes', icon: Layers },
            { id: 'fdr', label: 'FDR / Fixed Deposits', icon: Wallet },
            { id: 'dps', label: 'DPS / Monthly Recurring', icon: Coins },
            { id: 'loan', label: 'Loans (Home & Personal)', icon: CreditCard },
            { id: 'islamic', label: '100% Shariah Halal', icon: ShieldCheck },
            { id: 'govt', label: 'Sovereign / Sanchaya', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = directoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDirectoryTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-background text-primary font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Schemes List Cards */}
        <div className="space-y-3">
          {filteredSchemes.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/70 text-muted-foreground text-xs">
              No financial schemes matched your search filter.
            </div>
          ) : (
            filteredSchemes.map((scheme) => {
              const isExpanded = expandedSchemeId === scheme.id;
              const institution = BANK_INSTITUTIONS[scheme.bankId];

              return (
                <div
                  key={scheme.id}
                  className="rounded-2xl border border-border/70 bg-card hover:border-primary/40 transition-all p-4 sm:p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold text-foreground text-sm sm:text-base">
                          {scheme.bankShort}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-bold text-muted-foreground">
                          {scheme.schemeName}
                        </span>
                        <span className="px-2 py-0.2 rounded-md bg-muted font-mono text-[10px] text-muted-foreground font-semibold border border-border/60">
                          {scheme.creditRating}
                        </span>
                        {scheme.featuredBadge && (
                          <span className="px-2 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px] border border-amber-500/20">
                            {scheme.featuredBadge}
                          </span>
                        )}
                        {scheme.isIslamic && (
                          <span className="px-2 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
                            Islamic
                          </span>
                        )}
                        {scheme.isGovtBacked && (
                          <span className="px-2 py-0.2 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] border border-indigo-500/20">
                            Govt Backed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5">
                        <span>Tenure: <strong className="text-foreground">{scheme.tenureDisplay}</strong></span>
                        <span>•</span>
                        <span>Min Deposit: <strong className="text-foreground">{symbol}{scheme.minAmount.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Compounding: <strong className="text-foreground capitalize">{scheme.compounding}</strong></span>
                      </div>
                    </div>

                    {/* Rate & Action Controls */}
                    <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          {scheme.type === 'loan' ? 'Starting Rate' : 'Annual Return'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black font-mono text-primary">
                            {scheme.headlineRate}%
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {scheme.rateRangeDisplay !== `${scheme.headlineRate}%` && `(${scheme.rateRangeDisplay})`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePinToArena(scheme)}
                          className="h-8 text-xs font-semibold rounded-xl"
                          title="Compare in Scenario Arena"
                        >
                          <Swords className="w-3.5 h-3.5 text-amber-500 mr-1" />
                          <span className="hidden sm:inline">Arena</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleLoadScheme(scheme)}
                          className="h-8 text-xs font-bold rounded-xl"
                        >
                          <span>Calculate</span>
                        </Button>
                        <button
                          type="button"
                          onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                          className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground transition-colors ml-1"
                          aria-label="Toggle scheme details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Deep Analysis */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-border/60 space-y-4 animate-fade-in text-xs">
                      <div className="p-3.5 rounded-xl bg-primary/[0.04] border border-primary/15">
                        <span className="font-bold text-primary block uppercase text-[10px] mb-1">
                          FinLens Advisory Insight: Why Consider This Scheme?
                        </span>
                        <p className="text-foreground leading-relaxed">
                          {scheme.whyConsider}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-card border border-border/60">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                            Key Strengths & Perks:
                          </span>
                          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                            {scheme.pros.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-xl bg-card border border-border/60">
                          <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                            Important Caveats to Note:
                          </span>
                          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                            {scheme.cons.map((c, idx) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted-foreground p-2.5 rounded-xl bg-muted/40">
                        <span><strong>Tax Note: </strong>{scheme.taxNote}</span>
                        {institution && (
                          <span className="font-mono">
                            Safety Score: <strong className="text-foreground">{institution.safetyScore}/100</strong> ({institution.safetyTier})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
