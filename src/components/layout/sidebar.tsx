import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  PenTool,
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
  { to: "/ordens-de-servico", label: "Ordem de Serviço", icon: PenTool },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
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
        "relative flex h-full flex-col border-r border-white/10 bg-navy-950/95 backdrop-blur-xl transition-[width] duration-200 will-change-transform",
        collapsed ? "w-[100px]" : "w-64",
      )}
    >
      <button
        onClick={onToggleCollapsed}
        className="absolute -right-4 top-24 z-50 hidden h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-navy-950 bg-brand text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all hover:scale-110 active:scale-95 md:flex"
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      <div className="flex flex-col gap-3 px-5 py-6">
        <img src="/logo-tai-project.png" alt="Tai Project" className={cn("w-auto object-contain", collapsed ? "h-8" : "h-12")} />
        {!collapsed && (
          <p className="font-display truncate text-lg font-bold tracking-tight text-white">Tai Project</p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        {!collapsed && <p className="label-caps px-4 pb-2">Menu principal</p>}
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                    collapsed && "justify-center",
                    isActive
                      ? "bg-brand text-white shadow-soft"
                      : "text-muted hover:bg-white/10 hover:text-white",
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
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-colors",
                    collapsed && "justify-center",
                    isActive
                      ? "bg-brand text-white shadow-soft"
                      : "text-muted hover:bg-white/10 hover:text-white",
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

      <div className="border-t border-white/10 p-3">
        <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2", !collapsed && "bg-white/5")}>
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
