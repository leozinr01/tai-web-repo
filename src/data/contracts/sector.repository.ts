import type { Sector } from "@/domain/entities/sector";

export interface SectorRepository {
  /** `companyId` undefined = sem filtro por empresa (visao "todas as empresas", usada pelo Master). */
  listByCompany(companyId: string | undefined): Promise<Sector[]>;
  create(data: { companyId: string; name: string }): Promise<Sector>;
  update(id: string, data: Partial<Pick<Sector, "name">>): Promise<Sector>;
  remove(id: string): Promise<void>;
}
