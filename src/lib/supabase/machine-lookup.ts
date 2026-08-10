import { supabase } from "@/lib/supabase/client";

/**
 * Varias tabelas legadas ("Ordem de servico", "Apontamentos") guardam o NOME
 * da maquina em texto livre (idMaquina), nao o id numerico de "Maquinas".
 * Estes helpers resolvem nome <-> id nos dois sentidos.
 */

export interface MachineRef {
  id: number;
  maquina: string | null;
  idRef: string | null;
}

export async function getCompanyMachines(companyId: string): Promise<MachineRef[]> {
  const { data, error } = await supabase
    .from("Maquinas")
    .select("id, maquina, idRef")
    .eq("idRef", companyId);
  if (error) return [];
  return data ?? [];
}

export function buildNameToId(machines: MachineRef[]): Map<string, string> {
  return new Map(machines.filter((m) => m.maquina).map((m) => [m.maquina as string, String(m.id)]));
}

export async function resolveMachineName(machineId: string): Promise<{ name: string; companyId: string }> {
  const numericId = Number(machineId);
  if (Number.isNaN(numericId)) throw new Error("Maquina invalida.");
  const { data, error } = await supabase
    .from("Maquinas")
    .select("maquina, idRef")
    .eq("id", numericId)
    .maybeSingle();
  if (error || !data?.idRef) throw new Error("Nao foi possivel identificar a maquina/empresa.");
  return { name: data.maquina ?? machineId, companyId: data.idRef };
}
