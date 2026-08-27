import type { ReactNode } from "react";

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute -top-2 left-3 z-10 bg-navy-900 px-1 text-[10px] uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
