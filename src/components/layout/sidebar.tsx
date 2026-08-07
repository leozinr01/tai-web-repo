import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { UserRole } from "@/domain/types/enums";
import { userRoleLabels } from "@/lib/labels";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/apontamentos", label: "Apontamentos", icon: ClipboardList },
  { to: "/ordens-de-servico", label: "Ordem de Servico", icon: Wrench },
  { to: "/relatorios", label: "Relatorios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configuracoes", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-panel-border bg-navy-900 transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <button
        onClick={onToggleCollapsed}
        className="absolute -right-3 top-6 hidden h-6 w-6 items-center justify-center rounded-full border border-panel-border bg-brand text-white shadow-soft md:flex"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", collapsed && "rotate-180")} />
      </button>

      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand-light">
          <Building2 className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display truncate text-lg font-bold uppercase tracking-wide text-slate-100">
              Tai <span className="text-brand-light">Project</span>
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {!collapsed && <p className="label-caps px-2 pb-2">Menu principal</p>}
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand text-white shadow-soft"
                      : "text-slate-300 hover:bg-navy-800 hover:text-white",
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
          {user?.role === UserRole.MASTER && (
            <li>
              <NavLink
                to="/painel-master"
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand text-white shadow-soft"
                      : "text-slate-300 hover:bg-navy-800 hover:text-white",
                  )
                }
                title={collapsed ? "Painel Master" : undefined}
              >
                <Building2 className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">Painel Master</span>}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      <div className="border-t border-panel-border p-3">
        <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", !collapsed && "bg-navy-800")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            {user?.avatarInitials ?? "--"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">{user?.name}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {user ? userRoleLabels[user.role] : ""}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => logout()}
          className={cn(
            "mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-light hover:bg-danger/10",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && "Sair da conta"}
        </button>
      </div>
    </aside>
  );
}
