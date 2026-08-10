import type { AuthRepository } from "@/data/contracts/auth.repository";
import type { AuthSession } from "@/domain/entities/user";
import { UserStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase/client";
import { mapUserRow } from "@/lib/supabase/mappers";

function translateAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Credenciais invalidas. Verifique o e-mail e a senha.";
  }
  return message;
}

export class SupabaseAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error(translateAuthError(error?.message ?? "Nao foi possivel entrar."));
    }

    const { data: userRow, error: userError } = await supabase
      .from("User")
      .select("*")
      .eq("idRef", data.user.id)
      .maybeSingle();

    if (userError) {
      await supabase.auth.signOut();
      throw new Error("Nao foi possivel carregar os dados do usuario.");
    }
    if (!userRow) {
      await supabase.auth.signOut();
      throw new Error("Este login nao possui um cadastro de usuario vinculado.");
    }

    const user = mapUserRow(userRow);
    if (user.status === UserStatus.INACTIVE) {
      await supabase.auth.signOut();
      throw new Error("Este usuario esta desativado. Contate um administrador.");
    }

    return {
      user,
      token: data.session.access_token,
      expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString(),
    };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getSession(): Promise<AuthSession | null> {
    // getUser() revalida o token com o servidor (nao so le do localStorage),
    // conforme decidido na arquitetura do painel.
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;

    const { data: userRow, error: rowError } = await supabase
      .from("User")
      .select("*")
      .eq("idRef", userData.user.id)
      .maybeSingle();

    if (rowError || !userRow) return null;

    const user = mapUserRow(userRow);
    if (user.status === UserStatus.INACTIVE) return null;

    return {
      user,
      token: sessionData.session.access_token,
      expiresAt: new Date((sessionData.session.expires_at ?? 0) * 1000).toISOString(),
    };
  }
}
