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

const DECORATIVE_POINTS = 12;
const DECORATIVE_AMPLITUDE = 5;

/**
 * Curva "ruidosa" fixa (nao aleatoria, soma de senoides com fases diferentes
 * por metrica) usada so pra desenhar o mini-grafico quando ainda nao ha
 * historico real suficiente. Comeca/termina proximo do valor base e nao
 * estoura 0/100. O valor grande exibido no card nunca usa isso.
 */
function buildDecorativeWave(base: number, seed: number): number[] {
  const direction = base > 50 ? -1 : 1;
  return Array.from({ length: DECORATIVE_POINTS }, (_, i) => {
    const t = i / (DECORATIVE_POINTS - 1);
    const edgeFade = Math.sin(Math.PI * t); // 0 nas pontas, 1 no meio
    const noise =
      0.55 * Math.sin(t * Math.PI * 2 * 1.4 + seed) +
      0.3 * Math.sin(t * Math.PI * 2 * 3.1 + seed * 1.7 + 1.1) +
      0.15 * Math.sin(t * Math.PI * 2 * 5.3 + seed * 2.3 + 2.4);
    const value = base + direction * DECORATIVE_AMPLITUDE * edgeFade * ((noise + 1) / 2);
    return Math.max(0, Math.min(100, Math.round(value)));
  });
}

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

    const toHistory = (pick: (row: OeeGeralRow) => number | null, seed: number): IndicatorPoint[] => {
      const points = chronological.map((row, i) => ({
        label: new Date(row.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) || `D${i + 1}`,
        value: Math.round((pick(row) ?? 0) * 100),
      }));
      // Historico real curto demais para uma curva: gera pontos ao redor do ultimo valor real.
      if (points.length < 2) {
        const base = points[0]?.value ?? 0;
        const label = points[0]?.label ?? "";
        return buildDecorativeWave(base, seed).map((value) => ({ label, value }));
      }
      return points;
    };

    return {
      oee: Math.round((latest?.OEE ?? 0) * 100),
      availability: Math.round((latest?.Disponibilidade ?? 0) * 100),
      productivity: Math.round((latest?.Produtividade ?? 0) * 100),
      quality: Math.round((latest?.Qualidade ?? 0) * 100),
      oeeHistory: toHistory((row) => row.OEE, 0),
      availabilityHistory: toHistory((row) => row.Disponibilidade, 1.8),
      productivityHistory: toHistory((row) => row.Produtividade, 3.6),
      qualityHistory: toHistory((row) => row.Qualidade, 5.4),
    };
  }
}
