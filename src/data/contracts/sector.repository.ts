import type { Sector } from "@/domain/entities/sector";

export interface SectorRepository {
  listByCompany(companyId: string): Promise<Sector[]>;
}
