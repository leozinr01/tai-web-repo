import type { SectorRepository } from "@/data/contracts/sector.repository";
import type { Sector } from "@/domain/entities/sector";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork } from "@/lib/utils";

export class MockSectorRepository implements SectorRepository {
  async listByCompany(companyId: string): Promise<Sector[]> {
    return simulateNetwork(() =>
      mockDb.sectors
        .getAll()
        .filter((s) => s.companyId === companyId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }
}
