import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/data/repositories/supabase/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas (arquivo .env).",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
