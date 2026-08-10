import { supabase } from "@/lib/supabase/client";

export async function lookupUserName(userId: string): Promise<string> {
  if (!userId) return "Desconhecido";
  const { data } = await supabase
    .from("User")
    .select("nomeUser, nomeE")
    .eq("idRef", userId)
    .maybeSingle();
  return data?.nomeUser ?? data?.nomeE ?? "Desconhecido";
}
