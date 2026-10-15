/**
 * Apontamentos e ordens de servico (schema legado) referenciam maquina e
 * executor/lancador por NOME (texto), nao por id. Estes helpers resolvem a
 * ponte entre o id de dominio (Machine.id / User.id) e o texto persistido.
 */
import { supabase } from "@/lib/supabase-client";
import { fetchAllRows } from "@/data/repositories/supabase/helpers";

// Todas as buscas paginam: acima de 1000 linhas o Supabase corta sem avisar e os nomes deixariam de ser resolvidos.

interface MachineNameRow {
  id: number;
  maquina: string | null;
  idRef: string | null;
}

interface UserNameRow {
  idRef: string;
  nomeUser: string | null;
  idEmpresa: string | null;
}

export interface MachineNameMaps {
  idToName: Map<string, string>;
  nameToId: Map<string, string>;
}

export async function getMachineNameMaps(companyId: string): Promise<MachineNameMaps> {
  const rows = await fetchAllRows<MachineNameRow>((from, to) =>
    supabase.from("Maquinas").select("id, maquina").eq("idRef", companyId).order("id").range(from, to),
  );
  const idToName = new Map<string, string>();
  const nameToId = new Map<string, string>();
  for (const row of rows) {
    const id = String(row.id);
    const name = row.maquina ?? "";
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
  const [machineRows, userRows] = await Promise.all([
    fetchAllRows<MachineNameRow>((from, to) => {
      let query = supabase.from("Maquinas").select("id, maquina, idRef");
      if (companyId) query = query.eq("idRef", companyId);
      return query.order("id").range(from, to);
    }),
    fetchAllRows<UserNameRow>((from, to) => {
      let query = supabase.from("User").select("idRef, nomeUser, idEmpresa");
      if (companyId) query = query.eq("idEmpresa", companyId);
      return query.order("idRef").range(from, to);
    }),
  ]);

  const byCompany = new Map<string, CompanyNameMaps>();
  const mapsFor = (id: string) => {
    let maps = byCompany.get(id);
    if (!maps) {
      maps = { machineIdByName: new Map(), userIdByName: new Map() };
      byCompany.set(id, maps);
    }
    return maps;
  };
  for (const row of machineRows) {
    mapsFor(row.idRef ?? "").machineIdByName.set(row.maquina ?? "", String(row.id));
  }
  for (const row of userRows) {
    if (row.nomeUser) mapsFor(row.idEmpresa ?? "").userIdByName.set(row.nomeUser, row.idRef);
  }
  return mapsFor;
}

export async function getUserNameToId(companyId: string): Promise<Map<string, string>> {
  const rows = await fetchAllRows<UserNameRow>((from, to) =>
    supabase.from("User").select("idRef, nomeUser").eq("idEmpresa", companyId).order("idRef").range(from, to),
  );
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.nomeUser) map.set(row.nomeUser, row.idRef);
  }
  return map;
}
