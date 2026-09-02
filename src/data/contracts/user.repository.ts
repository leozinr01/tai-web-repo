import type { User } from "@/domain/entities/user";

export interface UserRepository {
  listByCompany(companyId: string): Promise<User[]>;
  create(data: Omit<User, "id" | "createdAt" | "avatarInitials">): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  setStatus(id: string, status: User["status"]): Promise<User>;
  remove(id: string): Promise<void>;
}
