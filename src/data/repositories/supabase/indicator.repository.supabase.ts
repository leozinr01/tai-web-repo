import type { IndicatorRepository } from "@/data/contracts/indicator.repository";
import type { DashboardIndicators, IndicatorPoint } from "@/domain/entities/indicator";
import { supabase } from "@/lib/supabase-client";

interface OeeGeralRow {
  created_at: string;
  OEE: number | null;
  Disponibilidade: number | null;
  Produtividade: number | null;
  Qualidade: number | null;
}

const COLUMNS = 'created_at, "OEE", "Disponibilidade", "Produtividade", "Qualidade"';

const toPercent = (value: number | null | undefined): number | null =>
  value == null ? null : Math.round(value * 100);

export class SupabaseIndicatorRepository implements IndicatorRepository {
  async getDashboardIndicators(companyId: string): Promise<DashboardIndicators> {
    const { data, error } = await supabase
      .from("OEE geral")
      .select(COLUMNS)
      .eq("idRef", companyId)
      .order("created_at", { ascending: false })
      .limit(7);
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as OeeGeralRow[];
    const latest = rows[0];
    const chronological = [...rows].reverse();

    // So leituras reais: sem valor nao vira 0, e historico curto nao e completado com pontos inventados.
    const toHistory = (pick: (row: OeeGeralRow) => number | null): IndicatorPoint[] =>
      chronological.flatMap((row) => {
        const value = toPercent(pick(row));
        if (value === null) return [];
        const label = new Date(row.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        return [{ label, value }];
      });

    return {
      oee: toPercent(latest?.OEE),
      availability: toPercent(latest?.Disponibilidade),
      productivity: toPercent(latest?.Produtividade),
      quality: toPercent(latest?.Qualidade),
      oeeHistory: toHistory((row) => row.OEE),
      availabilityHistory: toHistory((row) => row.Disponibilidade),
      productivityHistory: toHistory((row) => row.Produtividade),
      qualityHistory: toHistory((row) => row.Qualidade),
    };
  }
}
