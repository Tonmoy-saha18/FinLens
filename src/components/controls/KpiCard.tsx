import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
  className?: string;
  delay?: number;
}

/**
 * KPI summary card with icon, animated value, and optional trend indicator.
 */
export function KpiCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  accentColor = 'text-primary',
  className,
  delay = 0,
}: KpiCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-emerald-500'
      : trend === 'down'
        ? 'text-rose-500'
        : 'text-muted-foreground';

  return (
    <div
      className={cn(
        'glass-card rounded-xl p-4 hover-lift opacity-0 animate-fade-in',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={cn('p-1.5 rounded-lg bg-primary/10', accentColor)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className={cn('kpi-value animate-count-up', trendColor)} style={{ animationDelay: `${delay + 100}ms` }}>
        {value}
      </div>

      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
