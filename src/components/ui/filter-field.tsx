import type { ReactNode } from "react";

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    // O rotulo e so visual (fica sobre a borda); o grupo nomeado e o que o leitor de tela anuncia ao entrar no campo.
    <div className="relative" role="group" aria-label={label}>
      <span aria-hidden className="absolute -top-2 left-3 z-10 bg-navy-900 px-1 text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}
