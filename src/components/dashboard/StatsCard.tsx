import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  gradient?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  className,
  gradient 
}: StatsCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-5 transition-all duration-300",
      "hover:shadow-elevated hover:-translate-y-0.5",
      gradient ? "gradient-warm text-primary-foreground" : "bg-card shadow-card",
      className
    )}>
      {/* Background decoration */}
      {gradient && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      )}

      <div className="relative flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            gradient ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <p className="text-3xl font-display font-bold mt-1">
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-sm mt-1",
              gradient ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend.positive ? "text-accent" : "text-destructive"
              )}>
                {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className={cn(
                "text-xs",
                gradient ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                vs last week
              </span>
            </div>
          )}
        </div>

        <div className={cn(
          "p-3 rounded-xl",
          gradient ? "bg-white/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            gradient ? "text-primary-foreground" : "text-primary"
          )} />
        </div>
      </div>
    </div>
  );
}
