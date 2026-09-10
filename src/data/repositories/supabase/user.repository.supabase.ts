import type { UserRepository } from "@/data/contracts/user.repository";
import type { User } from "@/domain/entities/user";
import { supabase } from "@/lib/supabase-client";
import { initials } from "@/lib/utils";
import { roleToTipo, statusToDb, statusToDomain, tipoToRole } from "@/data/repositories/supabase/helpers";

interface UserRow {
  idRef: string;
  nomeUser: string | null;
  email: string | null;
  tipo: string | null;
  Status: string | null;
  idEmpresa: string | null;
  created_at: string;
}

const USER_COLUMNS = "idRef, nomeUser, email, tipo, Status, idEmpresa, created_at";

function toUser(row: UserRow): User {
  const name = row.nomeUser || row.email || "Usuario";
  return {
    id: row.idRef,
    companyId: row.idEmpresa ?? "",
    name,
    email: row.email ?? "",
    role: tipoToRole(row.tipo),
    status: statusToDomain(row.Status),
    avatarInitials: initials(name),
    createdAt: row.created_at,
  };
}

export class SupabaseUserRepository implements UserRepository {
  async listByCompany(companyId: string): Promise<User[]> {
    const { data, error } = await supabase.from("User").select(USER_COLUMNS).eq("idEmpresa", companyId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as UserRow[]).map(toUser).sort((a, b) => a.name.localeCompare(b.name));
  }

  async create(data: Omit<User, "id" | "createdAt" | "avatarInitials"> & { password: string }): Promise<User> {
    const { data: fnResult, error: fnError } = await supabase.functions.invoke("create-auth-user", {
      body: { email: data.email, password: data.password },
    });
    if (fnError) throw new Error(fnError.message);
    if (!fnResult || (fnResult as { error?: string }).error) {
      throw new Error((fnResult as { error?: string })?.error ?? "Nao foi possivel criar o acesso.");
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
    return toUser(row as UserRow);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch.nomeUser = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.role !== undefined) patch.tipo = roleToTipo(data.role);
    if (data.status !== undefined) patch.Status = statusToDb(data.status);
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("User").update(patch).eq("idRef", id);
      if (error) throw new Error(error.message);
    }
    const { data: row, error } = await supabase.from("User").select(USER_COLUMNS).eq("idRef", id).single();
    if (error) throw new Error("Usuario nao encontrado.");
    return toUser(row as UserRow);
  }

  async setStatus(id: string, status: User["status"]): Promise<User> {
    return this.update(id, { status });
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("User").delete().eq("idRef", id);
    if (error) throw new Error(error.message);
  }
}
