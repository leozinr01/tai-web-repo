import type { SectorRepository } from "@/data/contracts/sector.repository";
import type { Sector } from "@/domain/entities/sector";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid } from "@/lib/utils";

export class MockSectorRepository implements SectorRepository {
  async listByCompany(companyId: string): Promise<Sector[]> {
    return simulateNetwork(() =>
      mockDb.sectors
        .getAll()
        .filter((s) => s.companyId === companyId)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  async create(data: { companyId: string; name: string }): Promise<Sector> {
    return simulateNetwork(() => {
      const items = mockDb.sectors.getAll();
      const sector: Sector = { id: uid("sector"), companyId: data.companyId, name: data.name };
      mockDb.sectors.saveAll([...items, sector]);
      return sector;
    });
  }

  async update(id: string, data: Partial<Pick<Sector, "name">>): Promise<Sector> {
    return simulateNetwork(() => {
      const items = mockDb.sectors.getAll();
      const idx = items.findIndex((s) => s.id === id);
      const current = items[idx];
      if (idx === -1 || !current) throw new Error("Setor nao encontrado.");
      const updated: Sector = { ...current, ...data };
      const next = [...items];
      next[idx] = updated;
      mockDb.sectors.saveAll(next);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return simulateNetwork(() => {
      mockDb.sectors.saveAll(mockDb.sectors.getAll().filter((s) => s.id !== id));
    });
  }
}
