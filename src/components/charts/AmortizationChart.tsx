import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface AmortizationDataPoint {
  label: string;
  principalPortion: number;
  interestPortion: number;
  prepayment: number;
  outstandingBalance: number;
}

interface AmortizationChartProps {
  data: AmortizationDataPoint[];
  formatValue?: (v: number) => string;
}

/**
 * AmortizationChart — Stacked bar chart showing principal vs interest portions per month,
 * with an overlaid line for outstanding balance.
 */
export function AmortizationChart({
  data,
  formatValue = (v) => v.toLocaleString(),
}: AmortizationChartProps) {
  if (data.length === 0) return null;

  // For long schedules, sample every Nth data point for readability
  const maxBars = 48;
  const sampleRate = Math.max(1, Math.ceil(data.length / maxBars));
  const sampledData = data.filter((_, i) => i % sampleRate === 0 || i === data.length - 1);

  return (
    <div className="w-full h-[320px] animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sampledData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={0}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(220, 13%, 91%)"
            opacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(220, 9%, 46%)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => {
              if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
              if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
              if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
              return v.toString();
            }}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(224, 25%, 8%)',
              border: '1px solid hsl(224, 18%, 20%)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              padding: '12px',
            }}
            labelStyle={{ color: 'hsl(210, 20%, 95%)', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ fontSize: 12, padding: '2px 0' }}
            formatter={(value: unknown) => (typeof value === 'number' ? formatValue(value) : String(value ?? ''))}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <ReferenceLine y={0} stroke="hsl(220, 13%, 85%)" />
          <Bar
            dataKey="principalPortion"
            name="Principal"
            stackId="payment"
            fill="hsl(160, 60%, 45%)"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="interestPortion"
            name="Interest"
            stackId="payment"
            fill="hsl(340, 65%, 55%)"
            radius={[2, 2, 0, 0]}
          />
          {sampledData.some((d) => d.prepayment > 0) && (
            <Bar
              dataKey="prepayment"
              name="Prepayment"
              stackId="payment"
              fill="hsl(245, 58%, 51%)"
              radius={[2, 2, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
