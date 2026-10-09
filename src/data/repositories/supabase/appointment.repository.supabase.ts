import type {
  AppointmentFilters,
  AppointmentRepository,
  PagedResult,
} from "@/data/contracts/appointment.repository";
import type { Appointment } from "@/domain/entities/appointment";
import { AppointmentArea } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase-client";
import { fetchAllRows, formatBrDate, hhmmToMinutes, minutesToHHMM, padTime, parseBrDate } from "@/data/repositories/supabase/helpers";
import { getMachineNameMaps, getNameMapsByCompany, getUserNameToId } from "@/data/repositories/supabase/company-lookups";
import { watchCompanyTable } from "@/data/repositories/supabase/realtime";

interface ApontamentoRow {
  id: number;
  created_at: string;
  idMaquina: string | null;
  data_lancamento: string | null;
  hora_lancamento: string | null;
  lançador: string | null;
  apontamento: string | null;
  idRef: string;
  tempo_parada: string | null;
  OEE: string | null;
  seguimento_OEE: string | null;
  Setor: string | null;
  concluido_em: string | null;
}

const APONTAMENTO_COLUMNS =
  'id, created_at, "idMaquina", data_lancamento, hora_lancamento, "lançador", apontamento, "idRef", tempo_parada, "OEE", "seguimento_OEE", "Setor", concluido_em';

const AREA_VALUES = Object.values(AppointmentArea) as string[];

/** A coluna `OEE` guarda o pilar afetado com o mesmo texto do enum; valores fora dele caem em Disponibilidade. */
function areaFromOee(oee: string | null): AppointmentArea {
  return oee && AREA_VALUES.includes(oee) ? (oee as AppointmentArea) : AppointmentArea.DISPONIBILIDADE;
}

function toAppointment(
  row: ApontamentoRow,
  machineIdByName: Map<string, string>,
  userIdByName: Map<string, string>,
): Appointment {
  return {
    id: String(row.id),
    companyId: row.idRef,
    sectorId: row.Setor ?? "",
    machineId: machineIdByName.get(row.idMaquina ?? "") ?? "",
    area: areaFromOee(row.OEE),
    affectedSegment: row.seguimento_OEE ?? "",
    date: parseBrDate(row.data_lancamento),
    time: padTime(row.hora_lancamento),
    durationMinutes: hhmmToMinutes(row.tempo_parada),
    authorId: userIdByName.get(row.lançador ?? "") ?? "",
    authorName: row.lançador ?? "",
    description: row.apontamento ?? "",
    createdAt: row.created_at,
    completedAt: row.concluido_em,
  };
}

export class SupabaseAppointmentRepository implements AppointmentRepository {
  async list(companyId: string | undefined, filters?: AppointmentFilters): Promise<PagedResult<Appointment>> {
    // Data fica como texto dd/mm/aaaa no banco, entao o filtro de periodo e a paginacao sao feitos aqui.
    const rows = await fetchAllRows<ApontamentoRow>((from, to) => {
      let query = supabase.from("Apontamentos").select(APONTAMENTO_COLUMNS);
      if (companyId) query = query.eq("idRef", companyId);
      if (filters?.sectorId) query = query.eq("Setor", filters.sectorId);
      return query.order("id").range(from, to);
    });

    const mapsFor = await getNameMapsByCompany(companyId);

    let items = rows.map((row) => {
      const { machineIdByName, userIdByName } = mapsFor(row.idRef);
      return toAppointment(row, machineIdByName, userIdByName);
    });
    if (filters?.dateFrom) items = items.filter((a) => a.date >= filters.dateFrom!);
    if (filters?.dateTo) items = items.filter((a) => a.date <= filters.dateTo!);
    if (filters?.machineId) items = items.filter((a) => a.machineId === filters.machineId);
    if (filters?.authorId) items = items.filter((a) => a.authorId === filters.authorId);
    if (filters?.area) items = items.filter((a) => a.area === filters.area);
    if (filters?.affectedSegment) items = items.filter((a) => a.affectedSegment === filters.affectedSegment);

    items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 8;
    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  async getById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from("Apontamentos")
      .select(APONTAMENTO_COLUMNS)
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as ApontamentoRow;
    const [{ nameToId }, userNameToId] = await Promise.all([
      getMachineNameMaps(row.idRef),
      getUserNameToId(row.idRef),
    ]);
    return toAppointment(row, nameToId, userNameToId);
  }

  async create(data: Omit<Appointment, "id" | "createdAt" | "companyId" | "authorName" | "completedAt">): Promise<Appointment> {
    const { data: authorRow, error: authorError } = await supabase
      .from("User")
      .select("idRef, nomeUser, idEmpresa")
      .eq("idRef", data.authorId)
      .maybeSingle();
    if (authorError) throw new Error(authorError.message);
    const companyId = authorRow?.idEmpresa ?? "";
    const authorName = authorRow?.nomeUser ?? "Desconhecido";

    const { idToName } = await getMachineNameMaps(companyId);

    const { data: row, error } = await supabase
      .from("Apontamentos")
      .insert({
        idMaquina: idToName.get(data.machineId) ?? "",
        data_lancamento: formatBrDate(data.date),
        hora_lancamento: data.time,
        lançador: authorName,
        apontamento: data.description,
        idRef: companyId,
        tempo_parada: minutesToHHMM(data.durationMinutes),
        OEE: data.area,
        seguimento_OEE: data.affectedSegment,
        Setor: data.sectorId,
      })
      .select(APONTAMENTO_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    const [{ nameToId }, userNameToId] = await Promise.all([
      getMachineNameMaps(companyId),
      getUserNameToId(companyId),
    ]);
    return toAppointment(row as ApontamentoRow, nameToId, userNameToId);
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const { data: current, error: fetchError } = await supabase
      .from("Apontamentos")
      .select(APONTAMENTO_COLUMNS)
      .eq("id", Number(id))
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!current) throw new Error("Apontamento não encontrado.");
    const row = current as ApontamentoRow;
    const companyId = row.idRef;

    const patch: Record<string, unknown> = {};
    if (data.date !== undefined) patch.data_lancamento = formatBrDate(data.date);
    if (data.time !== undefined) patch.hora_lancamento = data.time;
    if (data.description !== undefined) patch.apontamento = data.description;
    if (data.durationMinutes !== undefined) patch.tempo_parada = minutesToHHMM(data.durationMinutes);
    if (data.area !== undefined) patch.OEE = data.area;
    if (data.affectedSegment !== undefined) patch.seguimento_OEE = data.affectedSegment;
    if (data.sectorId !== undefined) patch.Setor = data.sectorId;
    if (data.completedAt !== undefined) patch.concluido_em = data.completedAt;
    if (data.machineId !== undefined) {
      const { idToName } = await getMachineNameMaps(companyId);
      patch.idMaquina = idToName.get(data.machineId) ?? row.idMaquina;
    }
    if (data.authorId !== undefined) {
      const { data: authorRow } = await supabase.from("User").select("nomeUser").eq("idRef", data.authorId).maybeSingle();
      patch.lançador = authorRow?.nomeUser ?? row.lançador;
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("Apontamentos").update(patch).eq("id", Number(id));
      if (error) throw new Error(error.message);
    }

    const [{ nameToId }, userNameToId, refetch] = await Promise.all([
      getMachineNameMaps(companyId),
      getUserNameToId(companyId),
      supabase.from("Apontamentos").select(APONTAMENTO_COLUMNS).eq("id", Number(id)).single(),
    ]);
    if (refetch.error) throw new Error(refetch.error.message);
    return toAppointment(refetch.data as ApontamentoRow, nameToId, userNameToId);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("Apontamentos").delete().eq("id", Number(id));
    if (error) throw new Error(error.message);
  }

  watch(companyId: string | undefined, onChange: () => void): () => void {
    return watchCompanyTable("Apontamentos", companyId, onChange);
  }
}
