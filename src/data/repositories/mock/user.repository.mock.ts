import type { UserRepository } from "@/data/contracts/user.repository";
import type { User } from "@/domain/entities/user";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid, initials } from "@/lib/utils";

export class MockUserRepository implements UserRepository {
  async listByCompany(companyId: string): Promise<User[]> {
    return simulateNetwork(() =>
      mockDb.users
        .getAll()
        .filter((u) => u.companyId === companyId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async create(data: Omit<User, "id" | "createdAt" | "avatarInitials">): Promise<User> {
    return simulateNetwork(() => {
      const items = mockDb.users.getAll();
      const exists = items.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
      if (exists) throw new Error("Ja existe um usuario com este e-mail.");
      const user: User = {
        ...data,
        id: uid("user"),
        avatarInitials: initials(data.name),
        createdAt: new Date().toISOString(),
      };
      mockDb.users.saveAll([...items, user]);
      return user;
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return simulateNetwork(() => {
      const items = mockDb.users.getAll();
      const idx = items.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error("Usuario nao encontrado.");
      const current = items[idx];
      if (!current) throw new Error("Usuario nao encontrado.");
      const updated: User = {
        ...current,
        ...data,
        avatarInitials: data.name ? initials(data.name) : current.avatarInitials,
      };
      const next = [...items];
      next[idx] = updated;
      mockDb.users.saveAll(next);
      return updated;
    });
  }

  async setStatus(id: string, status: User["status"]): Promise<User> {
    return this.update(id, { status });
  }
}
