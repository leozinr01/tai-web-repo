/**
 * Apontamentos e ordens de servico (schema legado) referenciam maquina e
 * executor/lancador por NOME (texto), nao por id. Estes helpers resolvem a
 * ponte entre o id de dominio (Machine.id / User.id) e o texto persistido.
 */
import { supabase } from "@/lib/supabase-client";

export interface MachineNameMaps {
  idToName: Map<string, string>;
  nameToId: Map<string, string>;
}

export async function getMachineNameMaps(companyId: string): Promise<MachineNameMaps> {
  const { data, error } = await supabase.from("Maquinas").select("id, maquina").eq("idRef", companyId);
  if (error) throw new Error(error.message);
  const idToName = new Map<string, string>();
  const nameToId = new Map<string, string>();
  for (const row of data ?? []) {
    const id = String(row.id);
    const name = (row.maquina as string | null) ?? "";
    idToName.set(id, name);
    nameToId.set(name, id);
  }
  return { idToName, nameToId };
}

export async function getUserNameToId(companyId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("User").select("idRef, nomeUser").eq("idEmpresa", companyId);
  if (error) throw new Error(error.message);
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.nomeUser) map.set(row.nomeUser as string, row.idRef as string);
  }
  return map;
}
