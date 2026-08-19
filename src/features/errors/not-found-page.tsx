import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 bg-tai px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand-light">
        <Compass className="h-8 w-8" />
      </div>
      <p className="font-display text-6xl font-black text-white">404</p>
      <div>
        <p className="font-display text-lg font-bold text-white">
          Pagina nao encontrada
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          O endereco acessado nao existe ou foi movido. Volte para o painel principal.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Ir para o Dashboard
      </Link>
    </div>
  );
}
