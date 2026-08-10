import type {
  AppointmentFilters,
  AppointmentRepository,
  PagedResult,
} from "@/data/contracts/appointment.repository";
import type { Appointment } from "@/domain/entities/appointment";
import { supabase } from "@/lib/supabase/client";
import { isoDateToBr, mapAppointmentRow, minutesToHhMm } from "@/lib/supabase/mappers";
import { buildNameToId, getCompanyMachines, resolveMachineName } from "@/lib/supabase/machine-lookup";
import { lookupUserName } from "@/lib/supabase/user-lookup";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * "Apontamentos".data_lancamento e texto BR "D/M/AAAA" sem padding fixo (ex.
 * "29/8/2025"), entao filtros de data (dateFrom/dateTo, que chegam em ISO)
 * nao podem ser empurrados para o Postgres via gte/lte — ordem lexicografica
 * do texto nao bate com ordem cronologica. list() busca por empresa/setor/
 * maquina no banco e filtra data + pagina em memoria; o volume desta tabela
 * legada e pequeno o suficiente pra isso ser seguro.
 */
export class SupabaseAppointmentRepository implements AppointmentRepository {
  async list(companyId: string, filters?: AppointmentFilters): Promise<PagedResult<Appointment>> {
    const machines = await getCompanyMachines(companyId);
    const nameToId = buildNameToId(machines);

    let query = supabase.from("Apontamentos").select("*").eq("idRef", companyId);
    if (filters?.sectorId) query = query.eq("Setor", filters.sectorId);
    if (filters?.machineId) {
      const machineName = machines.find((m) => String(m.id) === filters.machineId)?.maquina;
      query = query.eq("idMaquina", machineName ?? filters.machineId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error("Nao foi possivel carregar os apontamentos.");

    let items = (data ?? []).map((row: Tables<"Apontamentos">) => mapAppointmentRow(row, companyId, nameToId));
    if (filters?.dateFrom) items = items.filter((a) => a.date >= filters.dateFrom!);
    if (filters?.dateTo) items = items.filter((a) => a.date <= filters.dateTo!);
    if (filters?.authorId) items = items.filter((a) => a.authorId === filters.authorId);

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 8;
    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize);

    return { items: pageItems, total, page, pageSize };
  }

  async getById(id: string): Promise<Appointment | null> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    const { data, error } = await supabase
      .from("Apontamentos")
      .select("*")
      .eq("id", numericId)
      .maybeSingle();
    if (error || !data || !data.idRef) return null;

    const machines = await getCompanyMachines(data.idRef);
    return mapAppointmentRow(data, data.idRef, buildNameToId(machines));
  }

  async create(
    data: Omit<Appointment, "id" | "createdAt" | "companyId" | "authorName">,
  ): Promise<Appointment> {
    const [{ name: machineName, companyId }, authorName] = await Promise.all([
      resolveMachineName(data.machineId),
      lookupUserName(data.authorId),
    ]);

    const { data: row, error } = await supabase
      .from("Apontamentos")
      .insert({
        idMaquina: machineName,
        Setor: data.sectorId,
        apontamento: data.description,
        seguimento_OEE: data.affectedSegment,
        data_lancamento: isoDateToBr(data.date),
        hora_lancamento: data.time,
        tempo_parada: minutesToHhMm(data.durationMinutes),
        lançador: authorName,
        idRef: companyId,
      })
      .select("*")
      .single();

    if (error || !row) throw new Error("Nao foi possivel criar o apontamento.");
    return mapAppointmentRow(row, companyId, new Map([[machineName, data.machineId]]));
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) throw new Error("Apontamento invalido.");

    const patch: Record<string, unknown> = {};
    let resolvedMachineName: string | undefined;
    if (data.machineId !== undefined) {
      const resolved = await resolveMachineName(data.machineId);
      resolvedMachineName = resolved.name;
      patch.idMaquina = resolved.name;
    }
    if (data.sectorId !== undefined) patch.Setor = data.sectorId;
    if (data.description !== undefined) patch.apontamento = data.description;
    if (data.affectedSegment !== undefined) patch.seguimento_OEE = data.affectedSegment;
    if (data.date !== undefined) patch.data_lancamento = isoDateToBr(data.date);
    if (data.time !== undefined) patch.hora_lancamento = data.time;
    if (data.durationMinutes !== undefined) patch.tempo_parada = minutesToHhMm(data.durationMinutes);
    if (data.authorId !== undefined) {
      patch.lançador = await lookupUserName(data.authorId);
    }

    const { data: row, error } = await supabase
      .from("Apontamentos")
      .update(patch)
      .eq("id", numericId)
      .select("*")
      .single();

    if (error || !row || !row.idRef) throw new Error("Nao foi possivel atualizar o apontamento.");

    const machines = await getCompanyMachines(row.idRef);
    const nameToId = buildNameToId(machines);
    if (resolvedMachineName && data.machineId) nameToId.set(resolvedMachineName, data.machineId);
    return mapAppointmentRow(row, row.idRef, nameToId);
  }

  async remove(id: string): Promise<void> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) throw new Error("Apontamento invalido.");
    const { error } = await supabase.from("Apontamentos").delete().eq("id", numericId);
    if (error) throw new Error("Nao foi possivel remover o apontamento.");
  }
}
