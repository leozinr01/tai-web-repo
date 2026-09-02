import type { AuthRepository } from "@/data/contracts/auth.repository";
import type { AuthSession } from "@/domain/entities/user";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { DEMO_PASSWORD } from "@/data/mocks/seed-users";
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { simulateNetwork, uid } from "@/lib/utils";
import { UserStatus } from "@/domain/types/enums";

export class MockAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<AuthSession> {
    return simulateNetwork(() => {
      const user = mockDb.users.getAll().find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user || password !== DEMO_PASSWORD) {
        throw new Error("Credenciais invalidas. Verifique o e-mail e a senha.");
      }
      if (user.status === UserStatus.INACTIVE) {
        throw new Error("Este usuario esta desativado. Contate um administrador.");
      }
      const session: AuthSession = {
        user,
        token: uid("token"),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      };
      storage.set(STORAGE_KEYS.SESSION, session);
      return session;
    }, { minMs: 500, maxMs: 900 });
  }

  async logout(): Promise<void> {
    storage.remove(STORAGE_KEYS.SESSION);
  }

  async changePassword(_newPassword: string): Promise<void> {
    await simulateNetwork(() => undefined, { minMs: 400, maxMs: 700 });
  }

  async getSession(): Promise<AuthSession | null> {
    const session = storage.get<AuthSession | null>(STORAGE_KEYS.SESSION, null);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      storage.remove(STORAGE_KEYS.SESSION);
      return null;
    }
    return session;
  }
}
