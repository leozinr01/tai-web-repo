import type { ReportFilters, ReportRepository } from "@/data/contracts/report.repository";
import type { ReportRow } from "@/domain/entities/report";
import { supabase } from "@/lib/supabase-client";
import { findVariableValue } from "@/data/repositories/supabase/helpers";

/** Limite de linhas por consulta: `Relatório` acumula uma linha por maquina a cada hora (milhares de registros), sem paginacao nesta tela. */
const MAX_ROWS = 2000;

interface RelatorioRow {
  id: number;
  created_at: string;
  idRef: string;
  OEE_disponibilidade: number | null;
  OEE_produtividade: number | null;
  OEE_qualidade: number | null;
  OEE: number | null;
  IDsala: string | null;
  maquina: string | null;
  date: string | null;
  hora: string | null;
  maquina_id: number | null;
  variables: Record<string, unknown> | null;
}

const COLUMNS =
  'id, created_at, "idRef", "OEE_disponibilidade", "OEE_produtividade", "OEE_qualidade", "OEE", "IDsala", maquina, date, hora, maquina_id, variables';

function findVariableUnit(variables: Record<string, unknown> | null | undefined, matchers: string[]): string {
  if (!variables) return "";
  for (const key of Object.keys(variables)) {
    if (matchers.some((m) => key.toLowerCase().includes(m))) {
      const match = /\(([^)]+)\)/.exec(key);
      return match?.[1] ?? "";
    }
  }
  return "";
}

function toReportRow(row: RelatorioRow): ReportRow {
  const time = (row.hora ?? "00:00").padStart(5, "0");
  const datetime = row.date ? new Date(`${row.date}T${time}:00`).toISOString() : row.created_at;
  return {
    id: String(row.id),
    datetime,
    sectorId: row.IDsala ?? "",
    sectorName: row.IDsala ?? "-",
    machineId: String(row.maquina_id ?? ""),
    machineName: row.maquina ?? "",
    oee: Math.round((row.OEE ?? 0) * 100),
    availability: Math.round((row.OEE_disponibilidade ?? 0) * 100),
    productivity: Math.round((row.OEE_produtividade ?? 0) * 100),
    quality: Math.round((row.OEE_qualidade ?? 0) * 100),
    horimeterHours: findVariableValue(row.variables, ["horímetro", "horimetro"]),
    vibrationMax: findVariableValue(row.variables, ["vibra"]),
    temperatureMax: findVariableValue(row.variables, ["temperatura"]),
    production: findVariableValue(row.variables, ["produção", "producao", "produc"]),
    productionUnit: findVariableUnit(row.variables, ["produção", "producao", "produc"]),
    additionalVariablesCount: row.variables ? Object.keys(row.variables).length : 0,
  };
}

export class SupabaseReportRepository implements ReportRepository {
  async list(companyId: string, filters?: ReportFilters): Promise<ReportRow[]> {
    let query = supabase
      .from("Relatório")
      .select(COLUMNS)
      .eq("idRef", companyId)
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);
    if (filters?.sectorId) query = query.eq("IDsala", filters.sectorId);
    if (filters?.machineId) query = query.eq("maquina_id", Number(filters.machineId));
    if (filters?.from) query = query.gte("date", filters.from);
    if (filters?.to) query = query.lte("date", filters.to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as RelatorioRow[]).map(toReportRow);
  }
}
