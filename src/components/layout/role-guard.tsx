import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import type { UserRole } from "@/domain/types/enums";

export function RoleGuard({ allow }: { allow: UserRole[] }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/acesso-negado" replace />;
  }
  return <Outlet />;
}
