import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY precisam estar definidas (arquivo .env.local).",
  );
}

/**
 * Cliente Supabase unico da aplicacao.
 *
 * Usa a chave publicavel (anon key) — a mesma que o app mobile ja usa.
 * Importante: hoje o banco "TAI" tem policies RLS abertas (USING true) em
 * quase todas as tabelas, entao o isolamento por empresa feito aqui no
 * cliente (filtros por idEmpresa nas queries) e uma camada de organizacao,
 * NAO uma garantia de seguranca. Ver nota em src/lib/supabase/README.md.
 */
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "tai-web-auth",
  },
});
