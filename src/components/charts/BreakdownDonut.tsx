import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface BreakdownSlice {
  name: string;
  value: number;
  color: string;
}

interface BreakdownDonutProps {
  data: BreakdownSlice[];
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
}

/**
 * BreakdownDonut — Animated donut chart with center label showing total/key metric.
 */
export function BreakdownDonut({
  data,
  centerLabel = '',
  centerValue = '',
  formatValue = (v) => v.toLocaleString(),
}: BreakdownDonutProps) {
  if (data.length === 0) return null;

  return (
    <div className="w-full h-[280px] relative animate-scale-in">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="drop-shadow-sm transition-all duration-200 hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(224, 25%, 8%)',
              border: '1px solid hsl(224, 18%, 20%)',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              padding: '10px 14px',
            }}
            itemStyle={{ fontSize: 12, color: 'hsl(210, 20%, 95%)' }}
            formatter={(value: unknown) => (typeof value === 'number' ? formatValue(value) : String(value ?? ''))}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, paddingTop: 0 }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: '50px' }}>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {centerLabel}
          </span>
          <span className="text-lg font-bold font-mono tabular-nums text-foreground">
            {centerValue}
          </span>
        </div>
      )}
    </div>
  );
}
