import { Link, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tela exibida quando uma rota quebra ao renderizar, no lugar da tela de erro padrao do React Router.
 * Com `fullScreen` ocupa a janela inteira; sem ele, cabe dentro do AppShell e o menu continua disponivel.
 */
export function RouteErrorPage({ fullScreen = false }: { fullScreen?: boolean }) {
  const error = useRouteError();
  const details = error instanceof Error ? error.message : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-4 text-center",
        fullScreen ? "min-h-screen bg-navy-950 bg-tai" : "min-h-[60vh]",
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15 text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div>
        <p className="font-display text-lg font-bold text-white">Algo deu errado</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Não foi possível exibir esta tela. Recarregue a página ou volte para o painel principal.
        </p>
        {import.meta.env.DEV && details && (
          <p className="mt-3 max-w-md break-words font-mono text-xs text-danger-light">{details}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
        >
          Recarregar página
        </button>
        <Link
          to="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-panel-border bg-white/5 px-4 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Ir para o Dashboard
        </Link>
      </div>
    </div>
  );
}
