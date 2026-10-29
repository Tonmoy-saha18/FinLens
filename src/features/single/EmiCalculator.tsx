import { useState, useMemo } from 'react';
import Decimal from 'decimal.js';
import {
  CreditCard,
  PiggyBank,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { calculateEmi } from '@/engine/emi';
import { DualSliderInput } from '@/components/controls/DualSliderInput';
import { KpiCard } from '@/components/controls/KpiCard';
import { AmortizationChart } from '@/components/charts/AmortizationChart';
import { BreakdownDonut } from '@/components/charts/BreakdownDonut';
import { ScheduleTable, type ColumnDef } from '@/components/tables/ScheduleTable';
import { useSettings } from '@/state/settings';
import { useScenarios } from '@/state/scenarios';
import { Button } from '@/components/ui/button';
import { Swords } from 'lucide-react';

interface EmiPreset {
  name: string;
  principal: number;
  rate: number;
  months: number;
  extraMonthly: number;
  yearlyLump: number;
}

const EMI_PRESETS: EmiPreset[] = [
  {
    name: 'Home Loan Standard (20 Yr)',
    principal: 5000000,
    rate: 9.0,
    months: 240,
    extraMonthly: 0,
    yearlyLump: 0,
  },
  {
    name: 'Home Loan + Extra (20 Yr)',
    principal: 5000000,
    rate: 9.0,
    months: 240,
    extraMonthly: 5000,
    yearlyLump: 50000,
  },
  {
    name: 'Car / Auto Loan (5 Yr)',
    principal: 1500000,
    rate: 11.5,
    months: 60,
    extraMonthly: 0,
    yearlyLump: 0,
  },
  {
    name: 'Personal Loan (3 Yr)',
    principal: 500000,
    rate: 13.0,
    months: 36,
    extraMonthly: 1000,
    yearlyLump: 0,
  },
];

export function EmiCalculator() {
  const { formatMoney, formatShort, symbol } = useSettings();
  const { pinScenario } = useScenarios();

  // Inputs
  const [loanPrincipal, setLoanPrincipal] = useState<number>(5000000);
  const [annualRate, setAnnualRate] = useState<number>(9.0);
  const [tenureMonths, setTenureMonths] = useState<number>(240);
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [extraMonthly, setExtraMonthly] = useState<number>(5000);
  const [yearlyLump, setYearlyLump] = useState<number>(50000);

  // Table display filter
  const [showAnnualOnly, setShowAnnualOnly] = useState<boolean>(true);

  const applyPreset = (p: EmiPreset) => {
    setLoanPrincipal(p.principal);
    setAnnualRate(p.rate);
    setTenureMonths(p.months);
    setExtraMonthly(p.extraMonthly);
    setYearlyLump(p.yearlyLump);
  };

  const handlePin = () => {
    pinScenario({
      name: `Loan ${formatShort(loanPrincipal)} @ ${annualRate}% (${tenureMonths}mo)`,
      type: 'emi',
      params: {
        Principal: formatShort(loanPrincipal),
        Rate: `${annualRate}%`,
        Tenure: `${tenureMonths} mo`,
        ExtraMonthly: extraMonthly > 0 ? formatShort(extraMonthly) : '0',
        LumpSum: yearlyLump > 0 ? formatShort(yearlyLump) : '0',
      },
      result,
    });
  };

  // Pure Engine Computation via useMemo (Zero Calculate Button)
  const result = useMemo(() => {
    return calculateEmi({
      loanPrincipal: new Decimal(loanPrincipal),
      annualRatePct: new Decimal(annualRate),
      tenureMonths,
      extraMonthlyPrepayment: new Decimal(extraMonthly),
      yearlyLumpSumPrepayment: new Decimal(yearlyLump),
    });
  }, [loanPrincipal, annualRate, tenureMonths, extraMonthly, yearlyLump]);

  // Amortization chart data
  const chartData = useMemo(() => {
    return result.schedule.map((row) => {
      const yr = Math.floor((row.month - 1) / 12) + 1;
      const mo = ((row.month - 1) % 12) + 1;
      return {
        label: result.schedule.length > 36 ? `Y${yr}M${mo}` : `M${row.month}`,
        principalPortion: row.principalPortion.toNumber(),
        interestPortion: row.interestPortion.toNumber(),
        prepayment: row.prepayment.toNumber(),
        outstandingBalance: row.outstandingBalance.toNumber(),
      };
    });
  }, [result]);

  // Donut slices: Principal vs Interest
  const donutData = useMemo(() => {
    return [
      {
        name: 'Loan Principal',
        value: loanPrincipal,
        color: 'hsl(160, 60%, 45%)',
      },
      {
        name: 'Total Interest Payable',
        value: result.totalInterestWithPrepayment.toNumber(),
        color: 'hsl(340, 65%, 55%)',
      },
    ];
  }, [loanPrincipal, result]);

  // Table data filter
  const tableData = useMemo(() => {
    if (!showAnnualOnly) return result.schedule;
    return result.schedule.filter(
      (r) => r.month % 12 === 0 || r.month === result.schedule.length
    );
  }, [result, showAnnualOnly]);

  const tableColumns: ColumnDef<any>[] = [
    {
      key: 'month',
      header: 'Month / Year',
      align: 'left',
      render: (r) => {
        const yr = Math.floor((r.month - 1) / 12) + 1;
        const mo = ((r.month - 1) % 12) + 1;
        return (
          <span className="font-semibold">
            Month {r.month} <span className="text-muted-foreground font-normal">(Yr {yr}, Mo {mo})</span>
          </span>
        );
      },
    },
    {
      key: 'emi',
      header: 'Base EMI',
      align: 'right',
      render: (r) => formatMoney(r.emi),
    },
    {
      key: 'principalPortion',
      header: 'Principal Paid',
      align: 'right',
      render: (r) => <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatMoney(r.principalPortion)}</span>,
    },
    {
      key: 'interestPortion',
      header: 'Interest Paid',
      align: 'right',
      render: (r) => <span className="text-rose-500 font-medium">{formatMoney(r.interestPortion)}</span>,
    },
    {
      key: 'prepayment',
      header: 'Prepayment',
      align: 'right',
      render: (r) =>
        r.prepayment.isZero() ? (
          <span className="text-muted-foreground/40">—</span>
        ) : (
          <span className="font-semibold text-primary">{formatMoney(r.prepayment)}</span>
        ),
    },
    {
      key: 'outstandingBalance',
      header: 'Remaining Balance',
      align: 'right',
      render: (r) => <span className="font-bold text-foreground">{formatMoney(r.outstandingBalance)}</span>,
    },
  ];

  const hasPrepayment = extraMonthly > 0 || yearlyLump > 0;
  const yearsSaved = (result.monthsSaved / 12).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Presets:
          </span>
          {EMI_PRESETS.map((p) => (
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
        {/* Left Column: Loan & Prepayment Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Base Loan Parameters */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Loan Parameters
            </h3>

            <DualSliderInput
              id="emi-principal"
              label="Loan Principal"
              value={loanPrincipal}
              onChange={setLoanPrincipal}
              min={10000}
              max={30000000}
              step={10000}
              prefix={symbol}
              hint="Supports 50k, 50L, 1.5Cr, etc."
            />

            <DualSliderInput
              id="emi-rate"
              label="Annual Interest Rate"
              value={annualRate}
              onChange={setAnnualRate}
              min={1.0}
              max={30.0}
              step={0.1}
              unit="%"
              decimals={1}
            />

            <DualSliderInput
              id="emi-tenure"
              label={tenureUnit === 'years' ? `Loan Tenure (${tenureMonths} mo)` : `Loan Tenure (${(tenureMonths / 12).toFixed(1)} yrs)`}
              value={tenureUnit === 'years' ? parseFloat((tenureMonths / 12).toFixed(1)) : tenureMonths}
              onChange={(v) => {
                const months = tenureUnit === 'years' ? Math.max(1, Math.round(v * 12)) : Math.max(1, Math.round(v));
                setTenureMonths(months);
              }}
              min={tenureUnit === 'years' ? 1 : 6}
              max={tenureUnit === 'years' ? 35 : 420}
              step={tenureUnit === 'years' ? 0.5 : 1}
              unit={tenureUnit === 'years' ? 'yr' : 'mo'}
              decimals={tenureUnit === 'years' ? 1 : 0}
              unitToggle={{
                current: tenureUnit,
                options: ['Years', 'Months'],
                onToggle: (u) => setTenureUnit(u.toLowerCase() as 'years' | 'months'),
              }}
            />
          </div>

          {/* Prepayment Optimizer Section */}
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                Prepayment Accelerator
              </h3>
              {hasPrepayment && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </span>
              )}
            </div>

            <DualSliderInput
              id="emi-extra-monthly"
              label="Extra Monthly Payment"
              value={extraMonthly}
              onChange={setExtraMonthly}
              min={0}
              max={100000}
              step={500}
              prefix={symbol}
              hint="Supports 5k, 10k, etc."
            />

            <DualSliderInput
              id="emi-yearly-lump"
              label="Annual Lump-Sum (Year-end)"
              value={yearlyLump}
              onChange={setYearlyLump}
              min={0}
              max={1000000}
              step={1000}
              prefix={symbol}
              hint="Supports 50k, 1L, etc."
            />

            <p className="text-[11px] text-muted-foreground italic">
              Prepayments reduce your loan principal immediately, dramatically compounding your lifetime interest savings.
            </p>
          </div>
        </div>

        {/* Right Column: Results & Visualizations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KpiCard
              label="Monthly EMI"
              value={formatMoney(result.baseEmi)}
              subtitle={`Total with extra: ${formatMoney(result.baseEmi.add(extraMonthly))}`}
              icon={CreditCard}
              trend="neutral"
              accentColor="text-indigo-500"
              className="col-span-2 sm:col-span-1"
            />
            <KpiCard
              label="Interest Saved"
              value={formatMoney(result.interestSaved)}
              subtitle={
                hasPrepayment
                  ? `Saved ${result.interestSaved.div(result.totalInterestWithoutPrepayment).mul(100).toFixed(1)}% of interest`
                  : 'Add prepayments to save'
              }
              icon={PiggyBank}
              trend={hasPrepayment ? 'up' : 'neutral'}
              accentColor="text-emerald-500"
            />
            <KpiCard
              label="Tenure Reduction"
              value={`${result.monthsSaved} mo`}
              subtitle={hasPrepayment ? `${yearsSaved} years earlier!` : 'Original tenure'}
              icon={CalendarCheck}
              trend={hasPrepayment ? 'up' : 'neutral'}
              accentColor="text-amber-500"
            />
          </div>

          {/* Prepayment Impact Banner */}
          {hasPrepayment ? (
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground">
                  Prepayment Win: Debt-free in {result.actualTenureMonths} months ({((result.actualTenureMonths) / 12).toFixed(1)} years) instead of {tenureMonths} months!
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Save {formatMoney(result.interestSaved)}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              <span>
                Slide the Extra Monthly or Annual Lump-Sum controls on the left to see how much interest and tenure you shave off!
              </span>
            </div>
          )}

          {/* Amortization Chart */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">Monthly Payment Composition</h4>
                <p className="text-xs text-muted-foreground">Principal portion (green) vs Interest portion (pink) vs Prepayment (purple)</p>
              </div>
            </div>

            <AmortizationChart
              data={chartData}
              formatValue={(v) => formatMoney(v)}
            />
          </div>

          {/* Donut breakdown */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold text-foreground">Total Cost of Loan</h4>
                <p className="text-xs text-muted-foreground">Principal Borrowed vs Total Interest Paid</p>
              </div>
            </div>
            <BreakdownDonut
              data={donutData}
              centerLabel="Total Outflow"
              centerValue={formatShort(result.totalInterestWithPrepayment.add(loanPrincipal))}
              formatValue={(v) => formatMoney(v)}
            />
          </div>
        </div>
      </div>

      {/* Expandable Schedule Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2 text-xs">
          <span className="text-muted-foreground">Filter Table View:</span>
          <button
            onClick={() => setShowAnnualOnly(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              showAnnualOnly
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual Milestones
          </button>
          <button
            onClick={() => setShowAnnualOnly(false)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              !showAnnualOnly
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All {result.schedule.length} Months
          </button>
        </div>

        <ScheduleTable
          title="Loan Amortization Schedule"
          subtitle={
            showAnnualOnly
              ? 'Displaying yearly summary milestones'
              : 'Displaying complete month-by-month principal & interest schedule'
          }
          columns={tableColumns}
          data={tableData}
          csvFilename={`emi_amortization_${loanPrincipal}_${tenureMonths}mo.csv`}
        />
      </div>
    </div>
  );
}
