import type { MachineFilters, MachineRepository } from "@/data/contracts/machine.repository";
import type { Machine } from "@/domain/entities/machine";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork } from "@/lib/utils";

const HIGH_VIBRATION_THRESHOLD = 0.55;
const HIGH_TEMPERATURE_THRESHOLD = 40;

export class MockMachineRepository implements MachineRepository {
  async listByCompany(companyId: string, filters?: MachineFilters): Promise<Machine[]> {
    return simulateNetwork(() => {
      let items = mockDb.machines.getAll().filter((m) => m.companyId === companyId);
      if (filters?.sectorId) items = items.filter((m) => m.sectorId === filters.sectorId);
      if (filters?.status) items = items.filter((m) => m.status === filters.status);
      if (filters?.highVibration) {
        items = items.filter((m) => m.variables.vibrationMm >= HIGH_VIBRATION_THRESHOLD);
      }
      if (filters?.highTemperature) {
        items = items.filter((m) => m.variables.temperatureC >= HIGH_TEMPERATURE_THRESHOLD);
      }
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async getById(id: string): Promise<Machine | null> {
    return simulateNetwork(() => mockDb.machines.getAll().find((m) => m.id === id) ?? null);
  }
}
