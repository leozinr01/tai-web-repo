import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "danger" | "brand" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success/15 text-success-light border-success/30",
  warning: "bg-warning/15 text-warning-light border-warning/30",
  danger: "bg-danger/15 text-danger-light border-danger/30",
  brand: "bg-brand/15 text-brand-light border-brand/30",
  neutral: "bg-navy-700 text-slate-300 border-panel-border",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-bold uppercase tracking-wide",
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
