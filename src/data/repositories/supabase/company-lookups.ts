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

export interface CompanyNameMaps {
  machineIdByName: Map<string, string>;
  userIdByName: Map<string, string>;
}

/**
 * Mapas nome -> id separados por empresa, para listas que misturam empresas (visao do Master):
 * o mesmo nome de maquina ou de usuario pode existir em mais de uma. `companyId` undefined carrega todas.
 */
export async function getNameMapsByCompany(
  companyId: string | undefined,
): Promise<(rowCompanyId: string) => CompanyNameMaps> {
  let machines = supabase.from("Maquinas").select("id, maquina, idRef");
  let users = supabase.from("User").select("idRef, nomeUser, idEmpresa");
  if (companyId) {
    machines = machines.eq("idRef", companyId);
    users = users.eq("idEmpresa", companyId);
  }
  const [machinesResult, usersResult] = await Promise.all([machines, users]);
  if (machinesResult.error) throw new Error(machinesResult.error.message);
  if (usersResult.error) throw new Error(usersResult.error.message);

  const byCompany = new Map<string, CompanyNameMaps>();
  const mapsFor = (id: string) => {
    let maps = byCompany.get(id);
    if (!maps) {
      maps = { machineIdByName: new Map(), userIdByName: new Map() };
      byCompany.set(id, maps);
    }
    return maps;
  };
  for (const row of machinesResult.data ?? []) {
    mapsFor((row.idRef as string | null) ?? "").machineIdByName.set((row.maquina as string | null) ?? "", String(row.id));
  }
  for (const row of usersResult.data ?? []) {
    if (row.nomeUser) mapsFor((row.idEmpresa as string | null) ?? "").userIdByName.set(row.nomeUser as string, row.idRef as string);
  }
  return mapsFor;
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
