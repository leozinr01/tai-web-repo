import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import type { IndicatorPoint } from "@/domain/entities/indicator";

export function IndicatorCard({
  label,
  value,
  history,
  color,
  isLoading,
  isError,
}: {
  label: string;
  value?: number | null;
  history?: IndicatorPoint[];
  color: string;
  isLoading?: boolean;
  isError?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-8 w-16" />
      </Card>
    );
  }

  // Sem leitura (ou com falha na consulta) mostra "—": 0% seria lido como indicador zerado.
  const hasValue = typeof value === "number";
  const errorMessage = hasValue ? "Falha ao atualizar" : "Falha ao carregar";
  const statusMessage = isError ? errorMessage : hasValue ? null : "Sem dados";

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <div className="rounded-lg bg-white/5 p-1.5">
          {isError ? (
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5" style={{ color }} />
          )}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className={cn("text-2xl font-bold", hasValue ? "text-white" : "text-muted")}>
            {hasValue ? `${value}%` : "—"}
          </span>
          {statusMessage && (
            <p className={cn("text-[11px]", isError ? "font-semibold text-warning-light" : "text-muted")}>
              {statusMessage}
            </p>
          )}
        </div>
        <div className="h-10 w-20">
          {history && history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin - 3", "dataMax + 3"]} />
                <Tooltip cursor={false} content={() => null} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${label})`}
                  isAnimationActive={false}
                  dot={false}
                  activeDot={{ r: 4, fill: color, stroke: "#0a1a2f", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
