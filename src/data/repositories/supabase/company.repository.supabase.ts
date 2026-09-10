import type { CompanyRepository, ListCompaniesParams } from "@/data/contracts/company.repository";
import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase-client";

interface EmpresaRow {
  idEmpresa: string;
  nome: string | null;
  logo_url: string | null;
  created_at: string;
}

const EMPRESA_COLUMNS = "idEmpresa, nome, logo_url, created_at";

/**
 * `Empresas` nao possui colunas de email/status (schema legado, nao alterado
 * pelo painel). O e-mail e derivado do usuario Master/Admin vinculado; o
 * status e sempre "ativo", ja que nao ha onde persistir uma desativacao.
 */
async function deriveEmail(companyId: string): Promise<string> {
  const { data, error } = await supabase.from("User").select("email, tipo").eq("idEmpresa", companyId);
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return "";
  const pick =
    rows.find((u) => u.tipo === "Master") ?? rows.find((u) => u.tipo === "Admin") ?? rows[0];
  return pick?.email ?? "";
}

async function countRows(table: "Sala" | "Maquinas", companyId: string): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("idRef", companyId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function toCompany(row: EmpresaRow): Promise<Company> {
  const [email, sectorsCount, machinesCount] = await Promise.all([
    deriveEmail(row.idEmpresa),
    countRows("Sala", row.idEmpresa),
    countRows("Maquinas", row.idEmpresa),
  ]);
  return {
    id: row.idEmpresa,
    name: row.nome ?? "",
    email,
    logoUrl: row.logo_url ?? undefined,
    status: CompanyStatus.ACTIVE,
    sectorsCount,
    machinesCount,
    createdAt: row.created_at,
  };
}

export class SupabaseCompanyRepository implements CompanyRepository {
  async list(params?: ListCompaniesParams): Promise<Company[]> {
    const { data, error } = await supabase
      .from("Empresas")
      .select(EMPRESA_COLUMNS)
      .order("nome", { ascending: true });
    if (error) throw new Error(error.message);
    const companies = await Promise.all(((data ?? []) as EmpresaRow[]).map(toCompany));
    if (!params?.search) return companies;
    const q = params.search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  async getById(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from("Empresas")
      .select(EMPRESA_COLUMNS)
      .eq("idEmpresa", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return toCompany(data as EmpresaRow);
  }

  async create(data: Omit<Company, "id" | "createdAt" | "sectorsCount" | "machinesCount">): Promise<Company> {
    const { data: row, error } = await supabase
      .from("Empresas")
      .insert({ nome: data.name, logo_url: data.logoUrl || null })
      .select(EMPRESA_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.idEmpresa,
      name: row.nome ?? "",
      email: data.email,
      logoUrl: row.logo_url ?? undefined,
      status: data.status,
      sectorsCount: 0,
      machinesCount: 0,
      createdAt: row.created_at,
    };
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.nome = data.name;
    if (data.logoUrl !== undefined) patch.logo_url = data.logoUrl;
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("Empresas").update(patch).eq("idEmpresa", id);
      if (error) throw new Error(error.message);
    }
    const current = await this.getById(id);
    if (!current) throw new Error("Empresa nao encontrada.");
    return { ...current, ...data };
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("Empresas").delete().eq("idEmpresa", id);
    if (error) {
      throw new Error(
        "Nao foi possivel excluir a empresa. Verifique se ainda existem setores, maquinas ou usuarios vinculados.",
      );
    }
  }

  async updateLogo(id: string, logoUrl: string): Promise<Company> {
    return this.update(id, { logoUrl });
  }
}
