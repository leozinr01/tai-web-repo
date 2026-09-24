import type { SectorRepository } from "@/data/contracts/sector.repository";
import type { Sector } from "@/domain/entities/sector";
import { supabase } from "@/lib/supabase-client";

interface SalaRow {
  sala: string;
  idRef: string;
}

/**
 * `Sala` nao tem chave numerica estavel usada pelas demais tabelas: maquinas,
 * apontamentos e ordens de servico referenciam o setor pelo NOME (texto), nao
 * pelo id. Por isso o id de dominio do setor e o proprio nome (`sala`).
 */
function toSector(row: SalaRow): Sector {
  return { id: row.sala, companyId: row.idRef, name: row.sala };
}

export class SupabaseSectorRepository implements SectorRepository {
  async listByCompany(companyId: string | undefined): Promise<Sector[]> {
    let query = supabase.from("Sala").select("sala, idRef").order("sala", { ascending: true });
    if (companyId) query = query.eq("idRef", companyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as SalaRow[]).map(toSector);
  }

  async create(data: { companyId: string; name: string }): Promise<Sector> {
    const { data: row, error } = await supabase
      .from("Sala")
      .insert({ sala: data.name, idRef: data.companyId })
      .select("sala, idRef")
      .single();
    if (error) throw new Error("Nao foi possivel criar o setor. O nome ja pode estar em uso.");
    return toSector(row as SalaRow);
  }

  async update(id: string, data: Partial<Pick<Sector, "name">>): Promise<Sector> {
    if (!data.name) {
      const { data: row, error } = await supabase.from("Sala").select("sala, idRef").eq("sala", id).single();
      if (error) throw new Error("Setor nao encontrado.");
      return toSector(row as SalaRow);
    }
    const { data: row, error } = await supabase
      .from("Sala")
      .update({ sala: data.name })
      .eq("sala", id)
      .select("sala, idRef")
      .single();
    if (error) throw new Error("Nao foi possivel renomear o setor. O nome ja pode estar em uso.");
    return toSector(row as SalaRow);
  }

  async remove(id: string): Promise<void> {
    const { data: machines, error: machinesError } = await supabase
      .from("Maquinas")
      .select("id")
      .eq("IDsala", id);
    if (machinesError) throw new Error(machinesError.message);
    const machineIds = (machines ?? []).map((m) => m.id as number);
    if (machineIds.length > 0) {
      const { error: variablesError } = await supabase.from("variables").delete().in("maquina_id", machineIds);
      if (variablesError) throw new Error(variablesError.message);
    }
    const { error } = await supabase.from("Sala").delete().eq("sala", id);
    if (error) throw new Error(error.message);
  }
}
