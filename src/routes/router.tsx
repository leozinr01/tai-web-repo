import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { RoleGuard } from "@/components/layout/role-guard";
import { LoginPage } from "@/features/auth/login-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { AppointmentsPage } from "@/features/appointments/appointments-page";
import { WorkOrdersPage } from "@/features/work-orders/work-orders-page";
import { ReportsPage } from "@/features/reports/reports-page";
import { SettingsPage } from "@/features/settings/settings-page";
import { CompaniesPage } from "@/features/companies/companies-page";
import { ForbiddenPage } from "@/features/errors/forbidden-page";
import { NotFoundPage } from "@/features/errors/not-found-page";
import { UserRole } from "@/domain/types/enums";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/acesso-negado", element: <ForbiddenPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/apontamentos", element: <AppointmentsPage /> },
          { path: "/ordens-de-servico", element: <WorkOrdersPage /> },
          { path: "/relatorios", element: <ReportsPage /> },
          { path: "/configuracoes", element: <SettingsPage /> },
          {
            element: <RoleGuard allow={[UserRole.MASTER]} />,
            children: [{ path: "/painel-master", element: <CompaniesPage /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
