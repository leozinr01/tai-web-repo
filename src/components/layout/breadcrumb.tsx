import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";

export function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-slate-200">
        <LayoutDashboard className="h-2.5 w-2.5" />
        Plataforma
      </Link>
      <span>/</span>
      <span className="text-brand">{current}</span>
    </div>
  );
}
