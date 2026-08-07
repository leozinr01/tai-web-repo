import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
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
      <Card className="p-5">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-8 w-16" />
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-3 p-5">
      <div>
        <p className="label-caps">{label}</p>
        <p className="font-display mt-1 text-3xl font-bold text-slate-100">{value ?? 0}%</p>
      </div>
      <div className="flex h-10 w-20 items-center gap-1">
        {history && history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${label})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <TrendingUp className="h-5 w-5 text-muted" />
        )}
      </div>
    </Card>
  );
}
