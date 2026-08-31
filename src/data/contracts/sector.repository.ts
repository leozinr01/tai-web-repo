import type { Sector } from "@/domain/entities/sector";

export interface SectorRepository {
  listByCompany(companyId: string): Promise<Sector[]>;
  create(data: { companyId: string; name: string }): Promise<Sector>;
  update(id: string, data: Partial<Pick<Sector, "name">>): Promise<Sector>;
  remove(id: string): Promise<void>;
}
