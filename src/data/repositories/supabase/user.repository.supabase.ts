import type { UserRepository } from "@/data/contracts/user.repository";
import type { User } from "@/domain/entities/user";
import { supabase } from "@/lib/supabase/client";
import { mapRoleToTipo, mapStatusToDb, mapUserRow } from "@/lib/supabase/mappers";

export class SupabaseUserRepository implements UserRepository {
  async listByCompany(companyId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from("User")
      .select("*")
      .eq("idEmpresa", companyId)
      .order("nomeUser", { ascending: true });
    if (error) throw new Error("Nao foi possivel carregar os usuarios.");
    return (data ?? []).map(mapUserRow);
  }

  async create(_data: Omit<User, "id" | "createdAt" | "avatarInitials">): Promise<User> {
    // Criar um usuario de verdade exige criar a conta no Supabase Auth
    // (auth.users) antes de gravar a linha em "User" — e isso requer a
    // service role key (Edge Function), que a chave anonima do frontend nao
    // tem permissao de usar. Nao criei nenhuma Edge Function porque isso
    // seria uma alteracao no projeto, que voce pediu para nao mexer por
    // enquanto. Preciso da sua confirmacao antes de implementar essa parte.
    throw new Error(
      "Criacao de usuario ainda nao disponivel: requer uma Edge Function com service role para criar a conta de autenticacao. Fale com o Claude para habilitar isso quando quiser seguir.",
    );
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.nomeUser = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.tipo = mapRoleToTipo(data.role);
    if (data.status !== undefined) patch.Status = mapStatusToDb(data.status);

    const { data: row, error } = await supabase
      .from("User")
      .update(patch)
      .eq("idRef", id)
      .select("*")
      .single();
    if (error || !row) throw new Error("Nao foi possivel atualizar o usuario.");
    return mapUserRow(row);
  }

  async setStatus(id: string, status: User["status"]): Promise<User> {
    return this.update(id, { status });
  }
}
