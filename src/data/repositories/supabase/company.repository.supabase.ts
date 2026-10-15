import type { CompanyRepository, ListCompaniesParams } from "@/data/contracts/company.repository";
import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase-client";
import { fetchAllRows } from "@/data/repositories/supabase/helpers";

interface EmpresaRow {
  idEmpresa: string;
  nome: string | null;
  logo_url: string | null;
  created_at: string;
}

const EMPRESA_COLUMNS = "idEmpresa, nome, logo_url, created_at";

interface CompanyStats {
  email: string;
  sectorsCount: number;
  machinesCount: number;
}

interface StatsUserRow {
  idEmpresa: string | null;
  email: string | null;
  tipo: string | null;
}

interface CompanyRefRow {
  idRef: string | null;
}

/**
 * `Empresas` nao possui colunas de email/status (schema legado, nao alterado
 * pelo painel). O e-mail e derivado do usuario Master/Admin vinculado; o
 * status e sempre "ativo", ja que nao ha onde persistir uma desativacao.
 *
 * Busca usuarios, setores e maquinas de uma vez (3 consultas no total, nao 3 por empresa)
 * e agrupa por empresa aqui. `companyId` undefined carrega todas.
 */
async function loadCompanyStats(companyId: string | undefined): Promise<(id: string) => CompanyStats> {
  const [users, sectors, machines] = await Promise.all([
    fetchAllRows<StatsUserRow>((from, to) => {
      let query = supabase.from("User").select("idEmpresa, email, tipo");
      if (companyId) query = query.eq("idEmpresa", companyId);
      return query.order("id").range(from, to);
    }),
    fetchAllRows<CompanyRefRow>((from, to) => {
      let query = supabase.from("Sala").select("idRef");
      if (companyId) query = query.eq("idRef", companyId);
      return query.order("id").range(from, to);
    }),
    fetchAllRows<CompanyRefRow>((from, to) => {
      let query = supabase.from("Maquinas").select("idRef");
      if (companyId) query = query.eq("idRef", companyId);
      return query.order("id").range(from, to);
    }),
  ]);

  const usersByCompany = new Map<string, StatsUserRow[]>();
  for (const user of users) {
    const key = user.idEmpresa ?? "";
    usersByCompany.set(key, [...(usersByCompany.get(key) ?? []), user]);
  }
  const countBy = (rows: CompanyRefRow[]) => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.idRef ?? "", (counts.get(row.idRef ?? "") ?? 0) + 1);
    return counts;
  };
  const sectorsByCompany = countBy(sectors);
  const machinesByCompany = countBy(machines);

  return (id) => {
    const companyUsers = usersByCompany.get(id) ?? [];
    const pick =
      companyUsers.find((u) => u.tipo === "Master") ?? companyUsers.find((u) => u.tipo === "Admin") ?? companyUsers[0];
    return {
      email: pick?.email ?? "",
      sectorsCount: sectorsByCompany.get(id) ?? 0,
      machinesCount: machinesByCompany.get(id) ?? 0,
    };
  };
}

function toCompany(row: EmpresaRow, stats: CompanyStats): Company {
  return {
    id: row.idEmpresa,
    name: row.nome ?? "",
    email: stats.email,
    logoUrl: row.logo_url ?? undefined,
    status: CompanyStatus.ACTIVE,
    sectorsCount: stats.sectorsCount,
    machinesCount: stats.machinesCount,
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
    const statsFor = await loadCompanyStats(undefined);
    const companies = ((data ?? []) as EmpresaRow[]).map((row) => toCompany(row, statsFor(row.idEmpresa)));
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
    const row = data as EmpresaRow;
    const statsFor = await loadCompanyStats(row.idEmpresa);
    return toCompany(row, statsFor(row.idEmpresa));
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
    if (!current) throw new Error("Empresa não encontrada.");
    return { ...current, ...data };
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("Empresas").delete().eq("idEmpresa", id);
    if (error) {
      throw new Error(
        "Não foi possível excluir a empresa. Verifique se ainda existem setores, máquinas ou usuários vinculados.",
      );
    }
  }

  async updateLogo(id: string, logoUrl: string): Promise<Company> {
    return this.update(id, { logoUrl });
  }
}
