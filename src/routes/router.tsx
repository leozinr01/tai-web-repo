import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { RoleGuard } from "@/components/layout/role-guard";
import { PageLoader } from "@/components/layout/page-loader";
import { LoginPage } from "@/features/auth/login-page";
import { ForbiddenPage } from "@/features/errors/forbidden-page";
import { NotFoundPage } from "@/features/errors/not-found-page";
import { RouteErrorPage } from "@/features/errors/route-error-page";
import { UserRole } from "@/domain/types/enums";

// Cada pagina vira um arquivo separado, baixado so quando a rota e aberta (o dashboard leva os graficos junto).
const pages = {
  dashboard: () => import("@/features/dashboard/dashboard-page").then((m) => ({ Component: m.DashboardPage })),
  appointments: () =>
    import("@/features/appointments/appointments-page").then((m) => ({ Component: m.AppointmentsPage })),
  workOrders: () => import("@/features/work-orders/work-orders-page").then((m) => ({ Component: m.WorkOrdersPage })),
  reports: () => import("@/features/reports/reports-page").then((m) => ({ Component: m.ReportsPage })),
  settings: () => import("@/features/settings/settings-page").then((m) => ({ Component: m.SettingsPage })),
  companies: () => import("@/features/companies/companies-page").then((m) => ({ Component: m.CompaniesPage })),
};

export const router = createBrowserRouter([
  {
    // Erro em qualquer rota fora do AppShell (login, guardas, o proprio shell) cai aqui.
    errorElement: <RouteErrorPage fullScreen />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/acesso-negado", element: <ForbiddenPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              {
                // Erro de uma pagina fica dentro do shell: o menu continua funcionando.
                errorElement: <RouteErrorPage />,
                children: [
                  { path: "/dashboard", lazy: pages.dashboard },
                  { path: "/apontamentos", lazy: pages.appointments },
                  { path: "/ordens-de-servico", lazy: pages.workOrders },
                  { path: "/relatorios", lazy: pages.reports },
                  { path: "/configuracoes", lazy: pages.settings },
                  {
                    element: <RoleGuard allow={[UserRole.MASTER]} />,
                    children: [{ path: "/painel-master", lazy: pages.companies }],
                  },
                ],
              },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
