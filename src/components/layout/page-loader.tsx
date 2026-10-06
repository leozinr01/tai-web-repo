import { Loader2 } from "lucide-react";

/** Tela cheia com o indicador de carregamento, usada enquanto a sessao ou o arquivo da pagina ainda nao chegou. */
export function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-navy-950 bg-tai">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
    </div>
  );
}
