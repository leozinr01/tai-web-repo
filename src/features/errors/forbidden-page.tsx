import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15 text-danger">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <p className="font-display text-6xl font-black text-white">403</p>
      <div>
        <p className="font-display text-lg font-bold text-white">
          Acesso negado
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Voce nao tem permissao para acessar esta area da plataforma. Fale com um administrador
          se acredita que isso e um engano.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-hover"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  );
}
