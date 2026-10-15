import type { UserRepository } from "@/data/contracts/user.repository";
import type { User } from "@/domain/entities/user";
import { supabase } from "@/lib/supabase-client";
import type { TablesUpdate } from "@/data/repositories/supabase/database.types";
import {
  roleToTipo,
  statusToDb,
  toDomainUser,
  USER_COLUMNS,
  type UserRow,
} from "@/data/repositories/supabase/helpers";

export class SupabaseUserRepository implements UserRepository {
  async listByCompany(companyId: string | undefined): Promise<User[]> {
    let query = supabase.from("User").select(USER_COLUMNS);
    if (companyId) query = query.eq("idEmpresa", companyId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as UserRow[]).map(toDomainUser).sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(data: Omit<User, "id" | "createdAt" | "avatarInitials"> & { password: string }): Promise<User> {
    const { data: fnResult, error: fnError } = await supabase.functions.invoke("create-auth-user", {
      body: { email: data.email, password: data.password },
    });
    if (fnError) throw new Error(fnError.message);
    if (!fnResult || (fnResult as { error?: string }).error) {
      throw new Error((fnResult as { error?: string })?.error ?? "Não foi possível criar o acesso.");
    }
    const authUserId = (fnResult as { id: string }).id;

    const { data: row, error } = await supabase
      .from("User")
      .insert({
        idRef: authUserId,
        email: data.email,
        nomeUser: data.name,
        tipo: roleToTipo(data.role),
        idEmpresa: data.companyId,
        Status: statusToDb(data.status),
      })
      .select(USER_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return toDomainUser(row as UserRow);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const patch: TablesUpdate<"User"> = {};
    if (data.name !== undefined) patch.nomeUser = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.tipo = roleToTipo(data.role);
    if (data.status !== undefined) patch.Status = statusToDb(data.status);
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("User").update(patch).eq("idRef", id);
      if (error) throw new Error(error.message);
    }
    const { data: row, error } = await supabase.from("User").select(USER_COLUMNS).eq("idRef", id).single();
    if (error) throw new Error("Usuário não encontrado.");
    return toDomainUser(row as UserRow);
  }

  async setStatus(id: string, status: User["status"]): Promise<User> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("User").delete().eq("idRef", id);
    if (error) throw new Error(error.message);
  }
}
