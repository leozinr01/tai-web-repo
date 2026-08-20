import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import type { IndicatorPoint } from "@/domain/entities/indicator";

export function IndicatorCard({
  label,
  value,
  history,
  color,
  isLoading,
}: {
  label: string;
  value?: number;
  history?: IndicatorPoint[];
  color: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-8 w-16" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="label-caps">{label}</p>
        <div className="rounded-lg bg-white/5 p-1.5">
          <TrendingUp className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value ?? 0}%</span>
        <div className="h-10 w-20">
          {history && history.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip cursor={false} content={() => null} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${label})`}
                  isAnimationActive
                  animationDuration={900}
                  activeDot={{ r: 3, fill: color, stroke: "#0a1a2f", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <TrendingUp className="h-5 w-5 text-muted" />
          )}
        </div>
      </div>
    </Card>
  );
}
