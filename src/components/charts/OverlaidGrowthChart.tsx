import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { type UnifiedChartPoint, type PinnedScenario } from '@/engine/comparison';

interface OverlaidGrowthChartProps {
  data: UnifiedChartPoint[];
  scenarios: PinnedScenario[];
  formatValue?: (v: number) => string;
  formatYAxis?: (v: number) => string;
}

export function OverlaidGrowthChart({
  data,
  scenarios,
  formatValue = (v) => v.toLocaleString(),
  formatYAxis,
}: OverlaidGrowthChartProps) {
  if (data.length === 0 || scenarios.length === 0) {
    return (
      <div className="w-full h-[340px] flex items-center justify-center border border-dashed rounded-xl text-muted-foreground text-xs">
        Pin at least 1 scenario to visualize the comparative growth trajectory.
      </div>
    );
  }

  return (
    <div className="w-full h-[340px] animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(220, 13%, 91%)"
            opacity={0.35}
            vertical={false}
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
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(224, 25%, 8%)',
              border: '1px solid hsl(224, 18%, 20%)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              padding: '12px',
            }}
            labelStyle={{ color: 'hsl(210, 20%, 95%)', fontWeight: 600, marginBottom: 6 }}
            itemStyle={{ fontSize: 12, padding: '3px 0' }}
            formatter={(value: unknown, name: unknown) => {
              const numVal = typeof value === 'number' ? value : 0;
              const scenario = scenarios.find((s) => s.id === name);
              const label = scenario ? scenario.name : String(name);
              return [formatValue(numVal), label];
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
            formatter={(value) => {
              const scenario = scenarios.find((s) => s.id === value);
              return scenario ? scenario.name : value;
            }}
          />

          {scenarios.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              stroke={s.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: s.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
