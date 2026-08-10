import type { SectorRepository } from "@/data/contracts/sector.repository";
import type { Sector } from "@/domain/entities/sector";
import { supabase } from "@/lib/supabase/client";
import { mapSectorRow } from "@/lib/supabase/mappers";
import type { Tables } from "@/lib/supabase/database.types";

export class SupabaseSectorRepository implements SectorRepository {
  async listByCompany(companyId: string): Promise<Sector[]> {
    const { data, error } = await supabase
      .from("Sala")
      .select("*")
      .eq("idRef", companyId)
      .order("sala", { ascending: true });
    if (error) throw new Error("Nao foi possivel carregar os setores.");
    return (data ?? []).map((row: Tables<"Sala">) => mapSectorRow(row, companyId));
  }
}
