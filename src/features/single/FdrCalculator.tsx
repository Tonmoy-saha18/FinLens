import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  Wallet,
  TrendingUp,
  Percent,
  Receipt,
  Sparkles,
  Layers,
  Table,
} from 'lucide-react';
import { calculateFdr } from '@/engine/fdr';
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

interface FdrPreset {
  name: string;
  principal: number;
  rate: number;
  months: number;
  compounding: CompoundingFrequency;
}

const FDR_PRESETS: FdrPreset[] = [
  { name: '1-Year High Yield', principal: 100000, rate: 9.5, months: 12, compounding: 'monthly' },
  { name: '3-Year Growth', principal: 200000, rate: 10.0, months: 36, compounding: 'quarterly' },
  { name: '5-Year Secure', principal: 500000, rate: 11.0, months: 60, compounding: 'half-yearly' },
  { name: '6-Month Simple', principal: 50000, rate: 8.5, months: 6, compounding: 'simple' },
];

export function FdrCalculator() {
  const { formatMoney, formatShort, symbol } = useSettings();
  const { pinScenario } = useScenarios();

  // Inputs
  const [principal, setPrincipal] = useState<number>(100000);
  const [annualRate, setAnnualRate] = useState<number>(9.5);
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('months');
  const [compounding, setCompounding] = useState<CompoundingFrequency>('monthly');

  // Reality adjustments
  const [taxPct, setTaxPct] = useState<number>(10.0);
  const [annualFee, setAnnualFee] = useState<number>(0);
  const [inflationPct, setInflationPct] = useState<number>(6.0);

  // View toggle: Visual analytics vs Inline schedule table
  const [viewMode, setViewMode] = useState<'visuals' | 'table'>('visuals');

  // Apply preset
  const applyPreset = (preset: FdrPreset) => {
    setPrincipal(preset.principal);
    setAnnualRate(preset.rate);
    setTenureMonths(preset.months);
    setCompounding(preset.compounding);
  };

  const handlePin = () => {
    pinScenario({
      name: `FDR ${formatShort(principal)} @ ${annualRate}% (${tenureMonths}mo)`,
      type: 'fdr',
      params: {
        Principal: formatShort(principal),
        Rate: `${annualRate}%`,
        Tenure: `${tenureMonths} mo`,
        Compounding: compounding,
      },
      result,
    });
  };

  // Pure Engine Computation via useMemo (Zero Calculate Button)
  const result = useMemo(() => {
    return calculateFdr({
      principal: new Decimal(principal),
      annualRatePct: new Decimal(annualRate),
      tenureMonths,
      compounding,
      taxPct: new Decimal(taxPct),
      annualFee: new Decimal(annualFee),
      inflationPct: new Decimal(inflationPct),
    });
  }, [principal, annualRate, tenureMonths, compounding, taxPct, annualFee, inflationPct]);

  // Chart data formatting
  const growthData = useMemo(() => {
    return result.breakdown.map((row) => ({
      label: row.label,
      principal: result.principal.toNumber(),
      grossBalance: row.grossBalance.toNumber(),
      netBalance: row.netBalance.toNumber(),
      realValue: row.realValue.toNumber(),
    }));
  }, [result]);

  const donutData = useMemo(() => {
    const netProfit = result.netMaturity.sub(result.principal).toNumber();
    const deductions = result.totalTax.add(result.totalFees).toNumber();

    return [
      { name: 'Principal', value: result.principal.toNumber(), color: 'hsl(220, 14%, 60%)' },
      { name: 'Net Profit', value: Math.max(0, netProfit), color: 'hsl(160, 60%, 45%)' },
      ...(deductions > 0
        ? [{ name: 'Tax & Fees', value: deductions, color: 'hsl(340, 65%, 55%)' }]
        : []),
    ];
  }, [result]);

  // Table columns
  const tableColumns: ColumnDef<any>[] = [
    { key: 'label', header: 'Period', align: 'left' },
    {
      key: 'grossBalance',
      header: 'Gross Balance',
      align: 'right',
      render: (r) => formatMoney(r.grossBalance),
    },
    {
      key: 'cumulativeInterest',
      header: 'Gross Interest',
      align: 'right',
      render: (r) => formatMoney(r.cumulativeInterest),
    },
    {
      key: 'cumulativeTax',
      header: 'Tax Deducted',
      align: 'right',
      render: (r) => formatMoney(r.cumulativeTax),
    },
    {
      key: 'cumulativeFees',
      header: 'Fees Deducted',
      align: 'right',
      render: (r) => formatMoney(r.cumulativeFees),
    },
    {
      key: 'netBalance',
      header: 'Net Maturity',
      align: 'right',
      render: (r) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(r.netBalance)}</span>,
    },
    {
      key: 'realValue',
      header: 'Real Value (Inflation)',
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
          {FDR_PRESETS.map((p) => (
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
        {/* Left column: Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Deposit Parameters
            </h3>

            <DualSliderInput
              id="fdr-principal"
              label="Deposit Principal"
              value={principal}
              onChange={setPrincipal}
              min={1000}
              max={10000000}
              step={1000}
              prefix={symbol}
              hint="Supports 50k, 2.5L, 1Cr, etc."
            />

            <DualSliderInput
              id="fdr-rate"
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
              id="fdr-tenure"
              label={tenureUnit === 'years' ? `Tenure (${tenureMonths} mo)` : `Tenure (${(tenureMonths / 12).toFixed(1)} yrs)`}
              value={tenureUnit === 'years' ? parseFloat((tenureMonths / 12).toFixed(2)) : tenureMonths}
              onChange={(v) => {
                const months = tenureUnit === 'years' ? Math.max(1, Math.round(v * 12)) : Math.max(1, Math.round(v));
                setTenureMonths(months);
              }}
              min={tenureUnit === 'years' ? 0.5 : 1}
              max={tenureUnit === 'years' ? 15 : 180}
              step={tenureUnit === 'years' ? 0.5 : 1}
              unit={tenureUnit === 'years' ? 'yr' : 'mo'}
              decimals={tenureUnit === 'years' ? 1 : 0}
              unitToggle={{
                current: tenureUnit,
                options: ['Months', 'Years'],
                onToggle: (u) => setTenureUnit(u.toLowerCase() as 'months' | 'years'),
              }}
            />

            {/* Compounding frequency selector */}
            <div className="space-y-1.5 pt-1">
              <label htmlFor="fdr-compounding" className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Compounding Frequency
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {(['monthly', 'quarterly', 'half-yearly', 'yearly', 'simple'] as CompoundingFrequency[]).map((f) => (
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

          {/* Reality adjustments toggles */}
          <RealityToggles
            taxPct={taxPct}
            onTaxPctChange={setTaxPct}
            annualFee={annualFee}
            onAnnualFeeChange={setAnnualFee}
            inflationPct={inflationPct}
            onInflationPctChange={setInflationPct}
          />
        </div>

        {/* Right column: Results & Visualizations (7 cols) */}
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
                <span>Progression Schedule ({result.breakdown.length})</span>
              </button>
            </div>

            {viewMode === 'visuals' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const el = document.getElementById('fdr-schedule-table');
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
              label="Net Interest"
              value={formatMoney(result.netMaturity.sub(result.principal))}
              subtitle={`Gross interest: ${formatMoney(result.grossInterest)}`}
              icon={Percent}
              trend="up"
              accentColor="text-indigo-500"
            />
            <KpiCard
              label="Effective Yield"
              value={`${result.netEffectiveYieldPct.toFixed(2)}%`}
              subtitle={`Nominal rate: ${annualRate.toFixed(1)}%`}
              icon={Receipt}
              trend="neutral"
              accentColor="text-amber-500"
            />
          </div>

          {viewMode === 'visuals' ? (
            <>
              {/* Charts container */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Wealth Trajectory</h4>
                    <p className="text-xs text-muted-foreground">Principal vs Net Value vs Inflation Discount</p>
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
                    <h4 className="text-sm font-bold text-foreground">Maturity Breakdown</h4>
                    <p className="text-xs text-muted-foreground">Principal vs Net Earnings vs Deductions</p>
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
              id="fdr-schedule-table-direct"
              title="FDR Compounding Schedule"
              subtitle="Detailed breakdown showing growth, tax deduction, and inflation discounting"
              columns={tableColumns}
              data={result.breakdown}
              csvFilename={`fdr_schedule_${principal}_${annualRate}pct.csv`}
              defaultExpanded={true}
            />
          )}
        </div>
      </div>

      {/* Bottom Schedule Table (Visible and expanded by default when in Visuals mode) */}
      {viewMode === 'visuals' && (
        <ScheduleTable
          id="fdr-schedule-table"
          title="FDR Compounding Schedule"
          subtitle="Detailed breakdown showing growth, tax deduction, and inflation discounting"
          columns={tableColumns}
          data={result.breakdown}
          csvFilename={`fdr_schedule_${principal}_${annualRate}pct.csv`}
          defaultExpanded={true}
        />
      )}
    </div>
  );
}
