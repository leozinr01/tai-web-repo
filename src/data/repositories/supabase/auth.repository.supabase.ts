import type { AuthRepository } from "@/data/contracts/auth.repository";
import type { AuthSession, User } from "@/domain/entities/user";
import { UserStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase-client";
import { initials } from "@/lib/utils";
import { statusToDomain, tipoToRole } from "@/data/repositories/supabase/helpers";

interface UserRow {
  idRef: string;
  nomeUser: string | null;
  email: string | null;
  tipo: string | null;
  Status: string | null;
  idEmpresa: string | null;
  created_at: string;
}

function toDomainUser(row: UserRow): User {
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

async function loadProfile(authUserId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("User")
    .select("idRef, nomeUser, email, tipo, Status, idEmpresa, created_at")
    .eq("idRef", authUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toDomainUser(data as UserRow);
}

export class SupabaseAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error("Credenciais invalidas. Verifique o e-mail e a senha.");
    }

    const profile = await loadProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      throw new Error("Usuario autenticado, mas sem cadastro vinculado. Contate um administrador.");
    }
    if (profile.status === UserStatus.INACTIVE) {
      await supabase.auth.signOut();
      throw new Error("Este usuario esta desativado. Contate um administrador.");
    }

    return {
      user: profile,
      token: data.session.access_token,
      expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString(),
    };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async changePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async getSession(): Promise<AuthSession | null> {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session || !session.user) return null;

    const profile = await loadProfile(session.user.id);
    if (!profile || profile.status === UserStatus.INACTIVE) return null;

    return {
      user: profile,
      token: session.access_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
    };
  }
}
