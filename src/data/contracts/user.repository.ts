import type { User } from "@/domain/entities/user";

export interface UserRepository {
  /** `companyId` undefined = sem filtro por empresa (visao "todas as empresas", usada pelo Master). */
  listByCompany(companyId: string | undefined): Promise<User[]>;
  create(data: Omit<User, "id" | "createdAt" | "avatarInitials"> & { password: string }): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  setStatus(id: string, status: User["status"]): Promise<User>;
  remove(id: string): Promise<void>;
}
