import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface GrowthDataPoint {
  label: string;
  principal: number;
  grossBalance: number;
  netBalance: number;
  realValue: number;
}

interface GrowthCurveChartProps {
  data: GrowthDataPoint[];
  formatValue?: (v: number) => string;
  formatYAxis?: (v: number) => string;
}

/**
 * GrowthCurveChart — Stacked area chart showing Principal vs. Gross vs. Net vs. Inflation-Adjusted.
 * Interactive tooltips with synchronized crosshairs.
 */
export function GrowthCurveChart({
  data,
  formatValue = (v) => v.toLocaleString(),
  formatYAxis,
}: GrowthCurveChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="w-full h-[320px] animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPrincipal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(220, 14%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(220, 14%, 60%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradGross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(35, 92%, 55%)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(35, 92%, 55%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(220, 13%, 91%)"
            opacity={0.4}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={
              formatYAxis ??
              ((v: number) => {
                if (v >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
                if (v >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
                if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
                return v.toString();
              })
            }
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
          <Area
            type="monotone"
            dataKey="principal"
            name="Principal"
            stroke="hsl(220, 14%, 60%)"
            fill="url(#gradPrincipal)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 1.5 }}
          />
          <Area
            type="monotone"
            dataKey="grossBalance"
            name="Gross Balance"
            stroke="hsl(245, 58%, 51%)"
            fill="url(#gradGross)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="netBalance"
            name="Net (After Tax/Fee)"
            stroke="hsl(160, 60%, 45%)"
            fill="url(#gradNet)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="realValue"
            name="Real Value (Inflation Adj.)"
            stroke="hsl(35, 92%, 55%)"
            fill="url(#gradReal)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
