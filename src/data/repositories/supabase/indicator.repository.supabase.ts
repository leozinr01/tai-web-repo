import type { IndicatorRepository } from "@/data/contracts/indicator.repository";
import type { DashboardIndicators, IndicatorPoint } from "@/domain/entities/indicator";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

type MachineOee = Pick<
  Tables<"Maquinas">,
  "OEE" | "OEE_disponibilidade" | "OEE_produtividade" | "OEE_qualidade"
>;

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

interface DailyAgg {
  oee: number[];
  availability: number[];
  productivity: number[];
  quality: number[];
}

export class SupabaseIndicatorRepository implements IndicatorRepository {
  async getDashboardIndicators(companyId: string): Promise<DashboardIndicators> {
    const [{ data: machines, error: machinesError }, { data: reports, error: reportsError }] =
      await Promise.all([
        supabase
          .from("Maquinas")
          .select("OEE, OEE_disponibilidade, OEE_produtividade, OEE_qualidade")
          .eq("idRef", companyId),
        supabase
          .from("Relatório")
          .select("date, OEE, OEE_disponibilidade, OEE_produtividade, OEE_qualidade")
          .eq("idRef", companyId)
          .order("date", { ascending: false })
          .limit(500),
      ]);

    if (machinesError) throw new Error("Nao foi possivel carregar os indicadores.");

    const machineRows: MachineOee[] = machines ?? [];
    const oee = avg(machineRows.map((m) => (m.OEE ?? 0) * 100));
    const availability = avg(machineRows.map((m) => (m.OEE_disponibilidade ?? 0) * 100));
    const productivity = avg(machineRows.map((m) => (m.OEE_produtividade ?? 0) * 100));
    const quality = avg(machineRows.map((m) => (m.OEE_qualidade ?? 0) * 100));

    const byDate = new Map<string, DailyAgg>();
    if (!reportsError) {
      for (const row of reports ?? []) {
        if (!row.date) continue;
        const bucket = byDate.get(row.date) ?? { oee: [], availability: [], productivity: [], quality: [] };
        bucket.oee.push((row.OEE ?? 0) * 100);
        bucket.availability.push((row.OEE_disponibilidade ?? 0) * 100);
        bucket.productivity.push((row.OEE_produtividade ?? 0) * 100);
        bucket.quality.push((row.OEE_qualidade ?? 0) * 100);
        byDate.set(row.date, bucket);
      }
    }

    const days = [...byDate.keys()].sort().slice(-7);
    const build = (pick: (b: DailyAgg) => number[]): IndicatorPoint[] =>
      days.map((day) => ({ label: day.slice(5), value: avg(pick(byDate.get(day)!)) }));

    return {
      oee,
      availability,
      productivity,
      quality,
      oeeHistory: days.length > 0 ? build((b) => b.oee) : [{ label: "hoje", value: oee }],
      availabilityHistory: days.length > 0 ? build((b) => b.availability) : [{ label: "hoje", value: availability }],
      productivityHistory: days.length > 0 ? build((b) => b.productivity) : [{ label: "hoje", value: productivity }],
      qualityHistory: days.length > 0 ? build((b) => b.quality) : [{ label: "hoje", value: quality }],
    };
  }
}
