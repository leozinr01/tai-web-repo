import type { AuthSession } from "@/domain/entities/user";

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  changePassword(newPassword: string): Promise<void>;
  /** Chama `onSignedOut` quando a sessao acaba fora do app (outra aba, refresh token expirado). Devolve a funcao para parar. */
  onSignedOut(onSignedOut: () => void): () => void;
}
