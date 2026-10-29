import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  Coins,
  TrendingUp,
  Percent,
  Sparkles,
  Layers,
  Zap,
  Table,
} from 'lucide-react';
import { calculateDps } from '@/engine/dps';
import { type CompoundingFrequency } from '@/engine/types';
import { DualSliderInput } from '@/components/controls/DualSliderInput';
import { RealityToggles } from '@/components/controls/RealityToggles';
import { KpiCard } from '@/components/controls/KpiCard';
import { GrowthCurveChart } from '@/components/charts/GrowthCurveChart';
import { BreakdownDonut } from '@/components/charts/BreakdownDonut';
import { ScheduleTable, type ColumnDef } from '@/components/tables/ScheduleTable';
import { useSettings } from '@/state/settings';
import { useScenarios } from '@/state/scenarios';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';

interface DpsPreset {
  name: string;
  monthly: number;
  rate: number;
  years: number;
  compounding: CompoundingFrequency;
}

const DPS_PRESETS: DpsPreset[] = [
  { name: 'Starter: 5-Yr (৳2.5K/mo)', monthly: 2500, rate: 9.0, years: 5, compounding: 'monthly' },
  { name: 'Builder: 10-Yr (৳5K/mo)', monthly: 5000, rate: 9.5, years: 10, compounding: 'monthly' },
  { name: 'Retirement: 15-Yr (৳15K/mo)', monthly: 15000, rate: 10.0, years: 15, compounding: 'quarterly' },
  { name: 'Wealth: 20-Yr (৳25K/mo)', monthly: 25000, rate: 10.5, years: 20, compounding: 'quarterly' },
];

export function DpsCalculator() {
  const { formatMoney, formatShort, symbol } = useSettings();
  const { pinScenario } = useScenarios();

  // Inputs
  const [monthlyInstallment, setMonthlyInstallment] = useState<number>(5000);
  const [annualRate, setAnnualRate] = useState<number>(9.5);
  const [tenureMonths, setTenureMonths] = useState<number>(120);
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [compounding, setCompounding] = useState<CompoundingFrequency>('monthly');

  // Reality adjustments
  const [taxPct, setTaxPct] = useState<number>(10.0);
  const [annualFee, setAnnualFee] = useState<number>(0);
  const [inflationPct, setInflationPct] = useState<number>(6.0);

  // View option: All months vs Annual milestones
  const [showAnnualOnly, setShowAnnualOnly] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'visuals' | 'table'>('visuals');

  // Preset handler
  const applyPreset = (p: DpsPreset) => {
    setMonthlyInstallment(p.monthly);
    setAnnualRate(p.rate);
    setTenureMonths(p.years * 12);
    setCompounding(p.compounding);
  };

  const handlePin = () => {
    const tenureDisplay = tenureUnit === 'years'
      ? `${(tenureMonths / 12).toFixed(1)} yrs`
      : `${tenureMonths} mo`;
    pinScenario({
      name: `DPS ${formatShort(monthlyInstallment)}/mo (${tenureDisplay})`,
      type: 'dps',
      params: {
        Monthly: formatShort(monthlyInstallment),
        Tenure: tenureDisplay,
        Rate: `${annualRate}%`,
        Compounding: compounding,
      },
      result,
    });
  };

  // Pure Engine Computation via useMemo (Zero Calculate Button)
  const result = useMemo(() => {
    return calculateDps({
      monthlyInstallment: new Decimal(monthlyInstallment),
      annualRatePct: new Decimal(annualRate),
      tenureYears: tenureMonths / 12,
      compounding,
      taxPct: new Decimal(taxPct),
      annualFee: new Decimal(annualFee),
      inflationPct: new Decimal(inflationPct),
    });
  }, [monthlyInstallment, annualRate, tenureMonths, compounding, taxPct, annualFee, inflationPct]);

  // Wealth multiplier
  const multiplier = useMemo(() => {
    if (result.totalDeposited.isZero()) return '1.00';
    return result.netMaturity.div(result.totalDeposited).toFixed(2);
  }, [result]);

  // Find compounding inflection point (first month where interest earned > 50% of monthly installment)
  const inflectionInfo = useMemo(() => {
    let inflectionMonth: number | null = null;
    let prevInterest = new Decimal(0);

    for (const row of result.breakdown) {
      const monthInterest = row.grossInterest.sub(prevInterest);
      prevInterest = row.grossInterest;
      if (monthInterest.gte(monthlyInstallment)) {
        inflectionMonth = row.month;
        break;
      }
    }

    if (inflectionMonth) {
      const yr = Math.floor((inflectionMonth - 1) / 12) + 1;
      const mo = ((inflectionMonth - 1) % 12) + 1;
      return `Month ${inflectionMonth} (Yr ${yr}, Mo ${mo})`;
    }
    return 'Beyond tenure';
  }, [result, monthlyInstallment]);

  // Chart data formatting (sampled if tenure is long)
  const growthData = useMemo(() => {
    const totalMonths = result.breakdown.length;
    const sampleRate = totalMonths > 60 ? Math.ceil(totalMonths / 48) : 1;

    return result.breakdown
      .filter((_, idx) => idx % sampleRate === 0 || idx === totalMonths - 1)
      .map((row) => {
        const yr = Math.floor((row.month - 1) / 12) + 1;
        const mo = ((row.month - 1) % 12) + 1;
        return {
          label: totalMonths > 36 ? `Y${yr} M${mo}` : `M${row.month}`,
          principal: row.totalDeposited.toNumber(),
          grossBalance: row.grossBalance.toNumber(),
          netBalance: row.netBalance.toNumber(),
          realValue: row.realValue.toNumber(),
        };
      });
  }, [result]);

  // Donut slices
  const donutData = useMemo(() => {
    const deductions = result.totalTax.add(result.totalFees).toNumber();
    return [
      { name: 'Total Deposited', value: result.totalDeposited.toNumber(), color: 'hsl(220, 14%, 60%)' },
      { name: 'Net Interest Earned', value: result.netInterest.toNumber(), color: 'hsl(160, 60%, 45%)' },
      ...(deductions > 0
        ? [{ name: 'Tax & Fees', value: deductions, color: 'hsl(340, 65%, 55%)' }]
        : []),
    ];
  }, [result]);

  // Table data filter
  const tableData = useMemo(() => {
    if (!showAnnualOnly) return result.breakdown;
    return result.breakdown.filter((r) => r.month % 12 === 0 || r.month === result.breakdown.length);
  }, [result, showAnnualOnly]);

  const tableColumns: ColumnDef<any>[] = [
    {
      key: 'month',
      header: 'Month / Milestone',
      align: 'left',
      render: (r) => {
        const yr = Math.floor((r.month - 1) / 12) + 1;
        const mo = ((r.month - 1) % 12) + 1;
        return (
          <span className="font-semibold">
            Month {r.month} <span className="text-muted-foreground font-normal">(Year {yr}, Mo {mo})</span>
          </span>
        );
      },
    },
    {
      key: 'totalDeposited',
      header: 'Deposited',
      align: 'right',
      render: (r) => formatMoney(r.totalDeposited),
    },
    {
      key: 'grossInterest',
      header: 'Cumulative Interest',
      align: 'right',
      render: (r) => <span className="text-indigo-600 dark:text-indigo-400 font-medium">{formatMoney(r.grossInterest)}</span>,
    },
    {
      key: 'netBalance',
      header: 'Net Balance',
      align: 'right',
      render: (r) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(r.netBalance)}</span>,
    },
    {
      key: 'realValue',
      header: 'Inflation Value',
      align: 'right',
      render: (r) => <span className="text-amber-600 dark:text-amber-400">{formatMoney(r.realValue)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Presets:
          </span>
          {DPS_PRESETS.map((p) => (
            <Button
              key={p.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(p)}
              className="h-7 text-xs rounded-full px-3 font-medium bg-card/60 hover:bg-primary/10 hover:text-primary transition-all"
            >
              {p.name}
            </Button>
          ))}
        </div>

        <Button
          onClick={handlePin}
          size="sm"
          className="h-8 gap-1.5 text-xs font-bold rounded-xl shadow-sm bg-primary/90 hover:bg-primary text-primary-foreground"
        >
          <Swords className="h-3.5 w-3.5" />
          <span>+ Pin to Arena</span>
        </Button>
      </div>

      {/* Main Grid: Controls vs Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              DPS Installment Plan
            </h3>

            <DualSliderInput
              id="dps-installment"
              label="Monthly Installment"
              value={monthlyInstallment}
              onChange={setMonthlyInstallment}
              min={100}
              max={200000}
              step={500}
              prefix={symbol}
              hint="Supports 5k, 25k, etc."
            />

            <DualSliderInput
              id="dps-rate"
              label="Annual Interest Rate"
              value={annualRate}
              onChange={setAnnualRate}
              min={0.1}
              max={30.0}
              step={0.1}
              unit="%"
              decimals={1}
            />

            <DualSliderInput
              id="dps-tenure"
              label={tenureUnit === 'years' ? `Tenure (${tenureMonths} mo)` : `Tenure (${(tenureMonths / 12).toFixed(1)} yrs)`}
              value={tenureUnit === 'years' ? parseFloat((tenureMonths / 12).toFixed(2)) : tenureMonths}
              onChange={(v) => {
                const months = tenureUnit === 'years' ? Math.max(1, Math.round(v * 12)) : Math.max(1, Math.round(v));
                setTenureMonths(months);
              }}
              min={tenureUnit === 'years' ? 0.5 : 1}
              max={tenureUnit === 'years' ? 30 : 360}
              step={tenureUnit === 'years' ? 0.5 : 1}
              unit={tenureUnit === 'years' ? 'yr' : 'mo'}
              decimals={tenureUnit === 'years' ? 1 : 0}
              unitToggle={{
                current: tenureUnit,
                options: ['Years', 'Months'],
                onToggle: (u) => setTenureUnit(u.toLowerCase() as 'years' | 'months'),
              }}
            />

            {/* Compounding frequency */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="dps-compounding" className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Compounding Frequency
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['monthly', 'quarterly', 'half-yearly', 'yearly'] as CompoundingFrequency[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCompounding(f)}
                    className={`py-1.5 px-2 text-[11px] rounded-lg font-medium capitalize border transition-all ${
                      compounding === f
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                        : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'
                    }`}
                  >
                    {f === 'half-yearly' ? 'Half-Yr' : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reality adjustments */}
          <RealityToggles
            taxPct={taxPct}
            onTaxPctChange={setTaxPct}
            annualFee={annualFee}
            onAnnualFeeChange={setAnnualFee}
            inflationPct={inflationPct}
            onInflationPctChange={setInflationPct}
          />
        </div>

        {/* Results & Visuals Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* View Mode Switcher Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs font-semibold">
              <button
                onClick={() => setViewMode('visuals')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'visuals'
                    ? 'bg-background text-foreground shadow-sm font-bold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Visual Analytics</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm font-bold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Progression Schedule ({tableData.length})</span>
              </button>
            </div>

            {viewMode === 'visuals' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('dps-schedule-table');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-8 gap-1.5 text-xs text-primary font-semibold hover:bg-primary/10"
              >
                <span>Jump to Schedule ↓</span>
              </Button>
            )}
          </div>

          {/* KPI Cards Row (Always visible for at-a-glance decision making) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              label="Net Maturity"
              value={formatMoney(result.netMaturity)}
              subtitle={`Real purchasing power: ${formatMoney(result.realPurchasingPower)}`}
              icon={TrendingUp}
              trend="up"
              accentColor="text-emerald-500"
              className="col-span-2 sm:col-span-1"
            />
            <KpiCard
              label="Wealth Multiplier"
              value={`${multiplier}×`}
              subtitle={`Deposited: ${formatMoney(result.totalDeposited)}`}
              icon={Zap}
              trend="up"
              accentColor="text-amber-500"
            />
            <KpiCard
              label="Net Interest"
              value={formatMoney(result.netInterest)}
              subtitle={`Tax paid: ${formatMoney(result.totalTax)}`}
              icon={Percent}
              trend="up"
              accentColor="text-indigo-500"
            />
          </div>

          {/* Compounding Inflection Banner */}
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold text-foreground">Interest Crossover Inflection Point:</span>
            </div>
            <span className="font-mono font-bold text-primary">{inflectionInfo}</span>
          </div>

          {viewMode === 'visuals' ? (
            <>
              {/* Growth Curve Chart */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Compounding Growth Curve</h4>
                    <p className="text-xs text-muted-foreground">Cumulative Deposits vs Net Value vs Purchasing Power</p>
                  </div>
                </div>

                <GrowthCurveChart
                  data={growthData}
                  formatValue={(v: number) => formatMoney(v)}
                  formatYAxis={(v: number) => formatShort(v)}
                />
              </div>

              {/* Donut breakdown */}
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Wealth Share Breakdown</h4>
                    <p className="text-xs text-muted-foreground">Your Deposits vs Pure Compound Growth</p>
                  </div>
                </div>
                <BreakdownDonut
                  data={donutData}
                  centerLabel="Net Maturity"
                  centerValue={formatShort(result.netMaturity)}
                  formatValue={(v) => formatMoney(v)}
                />
              </div>
            </>
          ) : (
            /* Direct Inline Schedule Table in main view */
            <ScheduleTable
              id="dps-schedule-table-direct"
              title="DPS Progression Schedule"
              subtitle={showAnnualOnly ? 'Displaying yearly summary milestones' : 'Displaying complete month-by-month trajectory'}
              columns={tableColumns}
              data={tableData}
              csvFilename={`dps_schedule_${monthlyInstallment}mo_${tenureMonths}m.csv`}
              defaultExpanded={true}
              filterSlot={
                <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60 text-[11px]">
                  <button
                    onClick={() => setShowAnnualOnly(true)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      showAnnualOnly
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Annual Milestones
                  </button>
                  <button
                    onClick={() => setShowAnnualOnly(false)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      !showAnnualOnly
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    All {result.breakdown.length} Mo
                  </button>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Bottom Schedule Table (Visible and expanded by default when in Visuals mode) */}
      {viewMode === 'visuals' && (
        <ScheduleTable
          id="dps-schedule-table"
          title="DPS Progression Schedule"
          subtitle={showAnnualOnly ? 'Displaying yearly summary milestones' : 'Displaying complete month-by-month trajectory'}
          columns={tableColumns}
          data={tableData}
          csvFilename={`dps_schedule_${monthlyInstallment}mo_${tenureMonths}m.csv`}
          defaultExpanded={true}
          filterSlot={
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60 text-[11px]">
              <button
                onClick={() => setShowAnnualOnly(true)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  showAnnualOnly
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual Milestones
              </button>
              <button
                onClick={() => setShowAnnualOnly(false)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  !showAnnualOnly
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All {result.breakdown.length} Mo
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}
