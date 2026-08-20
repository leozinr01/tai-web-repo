import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "danger" | "brand" | "neutral";

const textClasses: Record<BadgeTone, string> = {
  success: "text-success-light",
  warning: "text-warning-light",
  danger: "text-danger-light",
  brand: "text-brand-light",
  neutral: "text-slate-300",
};

const containerClasses: Record<BadgeTone, string> = {
  success: "border-success/40 bg-success/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.6)]",
  warning: "border-warning/40 bg-warning/20 shadow-[0_0_10px_-2px_rgba(251,146,60,0.6)]",
  danger: "border-danger/40 bg-danger/20 shadow-[0_0_10px_-2px_rgba(251,113,133,0.6)]",
  brand: "border-brand/40 bg-brand/20 shadow-[0_0_10px_-2px_rgba(59,130,246,0.6)]",
  neutral: "border-white/5 bg-white/5",
};

const dotClasses: Record<BadgeTone, string> = {
  success: "bg-success-light",
  warning: "bg-warning-light",
  danger: "bg-danger-light",
  brand: "bg-brand-light",
  neutral: "bg-slate-400",
};

export function Badge({
  tone = "neutral",
  children,
  icon,
  dot = true,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        containerClasses[tone],
        textClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClasses[tone])} />}
      {icon}
      {children}
    </span>
  );
}
