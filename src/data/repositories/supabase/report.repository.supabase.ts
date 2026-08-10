import type { ReportFilters, ReportRepository } from "@/data/contracts/report.repository";
import type { ReportRow } from "@/domain/entities/report";
import { supabase } from "@/lib/supabase/client";
import { mapReportRow } from "@/lib/supabase/mappers";
import type { Tables } from "@/lib/supabase/database.types";

const MAX_ROWS = 500;

async function getSectorNameById(companyId: string): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("Sala").select("sala").eq("idRef", companyId);
  if (error) return new Map();
  return new Map((data ?? []).map((s) => [s.sala, s.sala]));
}

export class SupabaseReportRepository implements ReportRepository {
  async list(companyId: string, filters?: ReportFilters): Promise<ReportRow[]> {
    const sectorNameById = await getSectorNameById(companyId);

    let query = supabase.from("Relatório").select("*").eq("idRef", companyId);
    if (filters?.from) query = query.gte("date", filters.from);
    if (filters?.to) query = query.lte("date", filters.to);
    if (filters?.sectorId) query = query.eq("IDsala", filters.sectorId);
    if (filters?.machineId) {
      const numericId = Number(filters.machineId);
      if (!Number.isNaN(numericId)) query = query.eq("maquina_id", numericId);
    }

    const { data, error } = await query
      .order("date", { ascending: false })
      .order("hora", { ascending: false })
      .limit(MAX_ROWS);
    if (error) throw new Error("Nao foi possivel carregar os relatorios.");
    return (data ?? []).map((row: Tables<"Relatório">) => mapReportRow(row, sectorNameById));
  }
}
