import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthSession } from "@/domain/entities/user";
import { repositories } from "@/data/repositories";
import { AuthContext, type AuthContextValue } from "@/features/auth/use-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    repositories.auth.getSession().then((s) => {
      if (mounted) {
        setSession(s);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await repositories.auth.login(email, password);
    setSession(s);
  }, []);

  const logout = useCallback(async () => {
    await repositories.auth.logout();
    setSession(null);
  }, []);

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
