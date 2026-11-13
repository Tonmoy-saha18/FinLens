import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  Sparkles,
  ShieldCheck,
  Search,
  ArrowRight,
  Building2,
  Coins,
  Wallet,
  CreditCard,
  Scale,
  Swords,
  ChevronDown,
  ChevronUp,
  Info,
  Award,
} from 'lucide-react';
import {
  BANK_SCHEMES,
  BANK_INSTITUTIONS,
  ADVISORY_PILLARS,
  getSmartRecommendation,
  type BankScheme,
} from '@/data/bankRates';

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
import { calculateFdr } from '@/engine/fdr';
import { calculateDps } from '@/engine/dps';
import { calculateEmi } from '@/engine/emi';
import { useSettings } from '@/state/settings';
import { useScenarios } from '@/state/scenarios';
import { Button } from '@/components/ui/button';

function renderSimulationBox(proj: TopPickProjection, formatMoney: (val: Decimal | number) => string) {
  if (proj.type === 'fdr') {
    return (
      <>
        <div>
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Simulated Deposit:</span>
          <span className="text-base font-extrabold text-foreground font-mono">
            {formatMoney(proj.amount)}
          </span>
          <span className="text-[11px] text-muted-foreground block">Tenure: {proj.tenureDisplay}</span>
        </div>
        <div>
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Gross Interest Earned:</span>
          <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            +{formatMoney(proj.grossInterest)}
          </span>
          <span className="text-[11px] text-muted-foreground block">Tax (10%): -{formatMoney(proj.totalTax)}</span>
        </div>
        <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
          <span className="text-primary uppercase text-[10px] font-black block">Net Take-Home Maturity:</span>
          <span className="text-lg font-black text-primary font-mono block">
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
        <div>
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Monthly Installment:</span>
          <span className="text-base font-extrabold text-foreground font-mono">
            {formatMoney(proj.amount)}/mo
          </span>
          <span className="text-[11px] text-muted-foreground block">Tenure: {proj.tenureDisplay}</span>
        </div>
        <div>
          <span className="text-muted-foreground uppercase text-[10px] font-bold block">Total Deposited:</span>
          <span className="text-base font-extrabold text-foreground font-mono">
            {formatMoney(proj.totalDeposited)}
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
            Profit: +{formatMoney(proj.grossInterest)}
          </span>
        </div>
        <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
          <span className="text-primary uppercase text-[10px] font-black block">Net Maturity Payout:</span>
          <span className="text-lg font-black text-primary font-mono block">
            {formatMoney(proj.netMaturity)}
          </span>
          <span className="text-[10px] text-muted-foreground">Compound wealth creation</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <span className="text-muted-foreground uppercase text-[10px] font-bold block">Loan Principal:</span>
        <span className="text-base font-extrabold text-foreground font-mono">
          {formatMoney(proj.amount)}
        </span>
        <span className="text-[11px] text-muted-foreground block">Tenure: {proj.tenureDisplay}</span>
      </div>
      <div>
        <span className="text-muted-foreground uppercase text-[10px] font-bold block">Total Bank Interest:</span>
        <span className="text-base font-extrabold text-destructive font-mono">
          {formatMoney(proj.totalInterest)}
        </span>
        <span className="text-[11px] text-muted-foreground block">Slide extra prepay to cut in half</span>
      </div>
      <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
        <span className="text-primary uppercase text-[10px] font-black block">Estimated Monthly EMI:</span>
        <span className="text-lg font-black text-primary font-mono block">
          {formatMoney(proj.baseEmi)}
        </span>
        <span className="text-[10px] text-muted-foreground">Excluding insurance & fees</span>
      </div>
    </>
  );
}

export function BankAdvisorView() {
  const { formatMoney, symbol } = useSettings();
  const { loadIntoCalculator, pinBankScheme, setActiveView } = useScenarios();

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
    <div className="space-y-10 animate-fade-in pb-16">
      {/* ── Header & Market Overview Bar ── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FinLens Market Intelligence & Advisory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Current Best Investment Plans & Bank Rates
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Real-world interest rates across FDR, DPS, and Loans in Bangladesh. Factoring in institutional credit safety, Source Tax (AIT), excise duties, and inflation to answer: <strong className="text-foreground">Which scheme is truly worth considering?</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveView('single')}
              className="text-xs font-semibold gap-1.5 rounded-xl"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span>Open Calculators</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveView('arena')}
              className="text-xs font-semibold gap-1.5 rounded-xl shadow-sm"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Go to Arena</span>
            </Button>
          </div>
        </div>

        {/* Live Macro Market Benchmarks */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Top FDR Yield
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">11.52%</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Govt / Sanchaya</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">10.5%-11.0% in Top Banks</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Top DPS Yield
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">10.50%</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">BRAC / City / EBL</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Compound monthly growth</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Lowest Home Loan
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">12.50%</span>
              <span className="text-[10px] text-muted-foreground font-semibold">DBBL</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">12.75% BRAC (0% prepay)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Inflation Hurdle
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400">~9.50%</span>
              <span className="text-[10px] text-amber-500 font-bold">CPI Rate</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Need &gt;10.5% for real gain</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/70 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
              Deposit Insurance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary">৳2.00L</span>
              <span className="text-[10px] text-muted-foreground font-medium">BD Bank</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">Max state protection</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 1: Interactive "Find My Best Plan" Wizard ── */}
      <section className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/[0.05] via-card to-card p-5 sm:p-7 shadow-lg shadow-primary/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Instant Recommendation Engine
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-foreground">
                Find Your Best Financial Plan in 3 Clicks
              </h3>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Personalized against real tax & inflation figures
          </span>
        </div>

        {/* Wizard Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1: Goal */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>1. Your Financial Goal:</span>
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
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <span>2. Your Priority:</span>
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
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
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
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
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
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
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
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wide border border-emerald-500/20">
                  ★ FinLens Top Pick
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold border border-border/70">
                  {recommendation.topPick.bankShort}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                  {recommendation.topPick.creditRating}
                </span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-foreground">
                {recommendation.summaryTitle}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {recommendation.verdictExplanation}
              </p>
            </div>

            {/* Headline Rate & Action */}
            <div className="sm:text-right shrink-0 p-3 sm:p-0 rounded-xl bg-muted/30 sm:bg-transparent">
              <span className="text-[11px] uppercase font-bold text-muted-foreground block">
                {recommendation.topPick.type === 'loan' ? 'Effective Borrowing Rate' : 'Annual Return / Profit'}
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
          <div className="p-4 rounded-xl bg-muted/40 border border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            <span>Financial Advisory Knowledge Base</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
            Which Bank & Plan is Truly Worth Considering?
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl">
            Don’t get fooled by advertised headline rates alone. Here is how institutional credit safety, inflation hurdles, tax certificates, and prepayment penalties dictate real wealth outcomes.
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

      {/* ── SECTION 3: Curated Editor's Choice Spotlight ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Award className="w-4 h-4" />
              <span>Editor's Marquee Selection</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Market Benchmarks to Pin & Compare
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BANK_SCHEMES.filter((s) => s.featuredBadge).slice(0, 4).map((scheme) => (
            <div
              key={scheme.id}
              className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {scheme.featuredBadge}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {scheme.creditRating.split(' ')[0]}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">
                    {scheme.bankShort}
                  </span>
                  <h4 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors">
                    {scheme.schemeName}
                  </h4>
                </div>

                <div className="py-2 border-y border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {scheme.type === 'loan' ? 'Starting Rate' : 'Annual Yield'}
                  </span>
                  <span className="text-2xl font-black font-mono text-primary">
                    {scheme.headlineRate}%
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">
                    {scheme.tenureDisplay}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                  {scheme.whyConsider}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePinToArena(scheme)}
                  className="flex-1 text-[11px] font-bold h-8 rounded-xl"
                  title="Pin to Scenario Arena"
                >
                  <Swords className="w-3 h-3 text-amber-500 mr-1" />
                  <span>Pin</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLoadScheme(scheme)}
                  className="flex-1 text-[11px] font-bold h-8 rounded-xl"
                >
                  <span>Calculate</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 4: Comprehensive Bank Rates Directory & Matrix ── */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <Building2 className="w-4 h-4" />
              <span>Full Market Directory</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground">
              Explore All Bank Schemes & Rates
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Filter by product type, search by bank, or sort by rates to find the exact plan for your portfolio.
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
            { id: 'all', label: 'All Schemes', icon: LayersIcon },
            { id: 'fdr', label: 'FDR / Fixed Deposits', icon: Wallet },
            { id: 'dps', label: 'DPS / Monthly Recurring', icon: Coins },
            { id: 'loan', label: 'Loans (Home & Personal)', icon: CreditCard },
            { id: 'islamic', label: '100% Shariah Halal', icon: ShieldCheck },
            { id: 'govt', label: 'Sovereign / Sanchaya', icon: Building2 },
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

function LayersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
