import type { CompanyRepository, ListCompaniesParams } from "@/data/contracts/company.repository";
import type { Company } from "@/domain/entities/company";
import { supabase } from "@/lib/supabase/client";
import { mapCompanyRow } from "@/lib/supabase/mappers";

async function countFor(table: "Sala" | "Maquinas", idEmpresa: string): Promise<number> {
  const column = table === "Sala" ? "idRef" : "idRef";
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(column, idEmpresa);
  return count ?? 0;
}

async function withCounts(row: Parameters<typeof mapCompanyRow>[0]): Promise<Company> {
  const idEmpresa = row.idEmpresa;
  if (!idEmpresa) return mapCompanyRow(row);
  const [sectorsCount, machinesCount] = await Promise.all([
    countFor("Sala", idEmpresa),
    countFor("Maquinas", idEmpresa),
  ]);
  return mapCompanyRow(row, { sectorsCount, machinesCount });
}

export class SupabaseCompanyRepository implements CompanyRepository {
  async list(params?: ListCompaniesParams): Promise<Company[]> {
    let query = supabase.from("Empresas").select("*");
    if (params?.search) {
      query = query.ilike("nome", `%${params.search}%`);
    }
    const { data, error } = await query.order("nome", { ascending: true });
    if (error) throw new Error("Nao foi possivel carregar as empresas.");
    return Promise.all((data ?? []).map(withCounts));
  }

  async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from("Empresas")
      .select("*")
      .eq("idEmpresa", id)
      .maybeSingle();
    if (error || !data) return null;
    return withCounts(data);
  }

  async create(data: Omit<Company, "id" | "createdAt" | "sectorsCount" | "machinesCount">): Promise<Company> {
    // OBS: a tabela "Empresas" nao tem coluna de e-mail nem de status — ver
    // README em src/lib/supabase para a decisao tomada sobre esses campos.
    const { data: row, error } = await supabase
      .from("Empresas")
      .insert({
        nome: data.name,
        logo_url: data.logoUrl ?? null,
      })
      .select("*")
      .single();
    if (error || !row) throw new Error("Nao foi possivel criar a empresa.");
    return mapCompanyRow(row, { sectorsCount: 0, machinesCount: 0 });
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.nome = data.name;
    if (data.logoUrl !== undefined) patch.logo_url = data.logoUrl;

    const { data: row, error } = await supabase
      .from("Empresas")
      .update(patch)
      .eq("idEmpresa", id)
      .select("*")
      .single();
    if (error || !row) throw new Error("Nao foi possivel atualizar a empresa.");
    return withCounts(row);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("Empresas").delete().eq("idEmpresa", id);
    if (error) throw new Error("Nao foi possivel remover a empresa.");
  }

  async updateLogo(id: string, logoUrl: string): Promise<Company> {
    return this.update(id, { logoUrl });
  }
}
