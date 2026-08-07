import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

export function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-slate-200">
        <LayoutGrid className="h-3.5 w-3.5" />
        Plataforma
      </Link>
      <span>/</span>
      <span className="text-brand-light">{current}</span>
    </div>
  );
}
