import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthSession } from "@/domain/entities/user";
import { repositories } from "@/data/repositories";
import { AuthContext, type AuthContextValue } from "@/features/auth/use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;
    repositories.auth
      .getSession()
      // Falha ao restaurar (rede, perfil inacessivel) manda para o login em vez de deixar o loader girando para sempre.
      .catch(() => null)
      .then((s) => {
        if (mounted) {
          setSession(s);
          setIsLoading(false);
        }
      });
    // Sessao encerrada em outra aba ou com refresh token vencido: a tela volta para o login em vez de seguir "logada".
    // O cache e descartado junto: dados de um usuario nao podem aparecer para o proximo que logar nesta aba.
    const stop = repositories.auth.onSignedOut(() => {
      queryClient.clear();
      if (mounted) setSession(null);
    });
    return () => {
      mounted = false;
      stop();
    };
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const s = await repositories.auth.login(email, password);
    queryClient.clear();
    setSession(s);
  }, [queryClient]);

  const logout = useCallback(async () => {
    await repositories.auth.logout();
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isLoading,
      isAuthenticated: !!session,
      login,
      logout,
    }),
    [session, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
