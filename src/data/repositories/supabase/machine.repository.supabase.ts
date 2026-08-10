import type { MachineFilters, MachineRepository } from "@/data/contracts/machine.repository";
import type { Machine } from "@/domain/entities/machine";
import { MachineStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase/client";
import { mapMachineRow } from "@/lib/supabase/mappers";
import type { Tables } from "@/lib/supabase/database.types";

const HIGH_VIBRATION_THRESHOLD = 0.55;
const HIGH_TEMPERATURE_THRESHOLD = 40;

export class SupabaseMachineRepository implements MachineRepository {
  async listByCompany(companyId: string, filters?: MachineFilters): Promise<Machine[]> {
    let query = supabase.from("Maquinas").select("*").eq("idRef", companyId);

    if (filters?.sectorId) query = query.eq("IDsala", filters.sectorId);
    if (filters?.status === MachineStatus.EMERGENCIA) query = query.eq("emergencia", true);
    if (filters?.status === MachineStatus.PARADO) query = query.eq("parado", true).eq("emergencia", false);
    if (filters?.status === MachineStatus.PRODUZINDO) {
      query = query.eq("parado", false).eq("emergencia", false);
    }
    if (filters?.highVibration) query = query.gte("Vibração", HIGH_VIBRATION_THRESHOLD);
    if (filters?.highTemperature) query = query.gte("Temperatura", HIGH_TEMPERATURE_THRESHOLD);

    const { data, error } = await query.order("maquina", { ascending: true });
    if (error) throw new Error("Nao foi possivel carregar as maquinas.");
    return (data ?? []).map((row: Tables<"Maquinas">) => mapMachineRow(row, companyId));
  }

  async getById(id: string): Promise<Machine | null> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    const { data, error } = await supabase.from("Maquinas").select("*").eq("id", numericId).maybeSingle();
    if (error || !data || !data.idRef) return null;
    return mapMachineRow(data, data.idRef);
  }
}
