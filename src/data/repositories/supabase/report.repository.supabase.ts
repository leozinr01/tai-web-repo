import type { ReportFilters, ReportRepository } from "@/data/contracts/report.repository";
import type { PagedResult } from "@/data/contracts/appointment.repository";
import type { ReportRow } from "@/domain/entities/report";
import { supabase } from "@/lib/supabase-client";
import { fetchAllRows, findVariableValue, RANGE_NOT_SATISFIABLE } from "@/data/repositories/supabase/helpers";

// `Relatório` acumula uma linha por maquina a cada hora (dezenas de milhares de registros):
// a tela pagina no banco e so a exportacao busca tudo.

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
  // `hora` vem do equipamento como texto; se vier fora do padrao usa created_at (toISOString lancaria erro).
  const local = row.date ? new Date(`${row.date}T${time}:00`) : null;
  const datetime = local && !Number.isNaN(local.getTime()) ? local.toISOString() : row.created_at;
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

function reportQuery(companyId: string, filters: ReportFilters, count?: "exact") {
  let query = supabase
    .from("Relatório")
    .select(COLUMNS, count ? { count } : undefined)
    .eq("idRef", companyId);
  if (filters.sectorId) query = query.eq("IDsala", filters.sectorId);
  if (filters.machineId) query = query.eq("maquina_id", Number(filters.machineId));
  if (filters.from) query = query.gte("date", filters.from);
  if (filters.to) query = query.lte("date", filters.to);
  // id desempata registros com o mesmo created_at, para as paginas nao repetirem nem pularem linhas.
  return query.order("created_at", { ascending: false }).order("id", { ascending: false });
}

export class SupabaseReportRepository implements ReportRepository {
  async list(companyId: string, filters: ReportFilters, page: number, pageSize: number): Promise<PagedResult<ReportRow>> {
    const start = (page - 1) * pageSize;
    const { data, error, count } = await reportQuery(companyId, filters, "exact").range(start, start + pageSize - 1);
    if (error?.code === RANGE_NOT_SATISFIABLE) {
      // Pagina alem do fim: devolve vazia, mas com o total certo para a paginacao se ajustar.
      const { count: total, error: countError } = await reportQuery(companyId, filters, "exact").limit(0);
      if (countError) throw new Error(countError.message);
      return { items: [], total: total ?? 0, page, pageSize };
    }
    if (error) throw new Error(error.message);
    return { items: ((data ?? []) as RelatorioRow[]).map(toReportRow), total: count ?? 0, page, pageSize };
  }

  async listAll(companyId: string, filters: ReportFilters): Promise<ReportRow[]> {
    const rows = await fetchAllRows<RelatorioRow>((from, to) => reportQuery(companyId, filters).range(from, to));
    return rows.map(toReportRow);
  }
}
