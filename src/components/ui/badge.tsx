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
        "inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
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
