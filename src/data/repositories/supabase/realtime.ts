import { supabase } from "@/lib/supabase-client";

let channelSeq = 0;

/**
 * Avisa quando uma linha da tabela (da empresa) e criada, alterada ou apagada.
 * `companyId` undefined ouve todas as empresas (visao do Master).
 * A tabela precisa estar na publicacao `supabase_realtime` do banco.
 * Devolve a funcao que cancela a inscricao.
 */
export function watchCompanyTable(table: string, companyId: string | undefined, onChange: () => void): () => void {
  // Nome unico: o supabase-js reaproveita canais com o mesmo nome, e fechar um fecharia o outro.
  const channel = supabase
    .channel(`watch:${table}:${companyId ?? "todas"}:${++channelSeq}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, ...(companyId ? { filter: `idRef=eq.${companyId}` } : {}) },
      onChange,
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
