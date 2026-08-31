import type { MachineFilters, MachineRepository } from "@/data/contracts/machine.repository";
import type { Machine, MachineCardSettings } from "@/domain/entities/machine";
import { MachineStatus } from "@/domain/types/enums";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid } from "@/lib/utils";

const HIGH_VIBRATION_THRESHOLD = 0.55;
const HIGH_TEMPERATURE_THRESHOLD = 40;

export class MockMachineRepository implements MachineRepository {
  async listByCompany(companyId: string, filters?: MachineFilters): Promise<Machine[]> {
    return simulateNetwork(() => {
      let items = mockDb.machines.getAll().filter((m) => m.companyId === companyId);
      if (filters?.sectorId) items = items.filter((m) => m.sectorId === filters.sectorId);
      if (filters?.machineId) items = items.filter((m) => m.id === filters.machineId);
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

  async create(data: { companyId: string; sectorId: string; name: string }): Promise<Machine> {
    return simulateNetwork(() => {
      const items = mockDb.machines.getAll();
      const machine: Machine = {
        id: uid("machine"),
        companyId: data.companyId,
        sectorId: data.sectorId,
        name: data.name,
        code: data.name.trim().slice(0, 6).toUpperCase().replace(/\s+/g, "-"),
        status: MachineStatus.PARADO,
        oeePercent: 0,
        availabilityPercent: 0,
        productivityPercent: 0,
        qualityPercent: 0,
        variables: {
          horimeterHours: 0,
          vibrationMm: 0,
          temperatureC: 0,
          speed: 0,
          speedUnit: "m/s",
          productionAmount: 0,
          productionUnit: "un",
        },
        complementaryCount: 0,
        oeeHistory: Array.from({ length: 12 }, () => 0),
        customVariables: [],
        cardSettings: {
          showOeeCircle: true,
          topVariableKeys: ["horimeter", "vibration", "temperature"],
          bottomVariableKeys: ["speed", "production"],
          bottomVariableVisible: [true, true],
        },
        lossBreakdown: {
          availability: [
            { key: "breakdown", label: "Quebra / Falhas", minutes: 0 },
            { key: "setup", label: "Setup", minutes: 0 },
            { key: "idle", label: "Ociosidade", minutes: 0 },
          ],
          productivity: [
            { key: "small_stops", label: "Pequenas Falhas", minutes: 0 },
            { key: "reduced_speed", label: "Queda de Velocidade", minutes: 0 },
            { key: "raw_material_defect", label: "Defeito Materia Prima", minutes: 0 },
          ],
          quality: [
            { key: "non_conforming_product", label: "Produto Nao Conforme", minutes: 0 },
            { key: "scrap", label: "Refugo", minutes: 0 },
            { key: "rework", label: "Retrabalho", minutes: 0 },
          ],
        },
      };
      mockDb.machines.saveAll([...items, machine]);
      return machine;
    });
  }

  async remove(id: string): Promise<void> {
    return simulateNetwork(() => {
      mockDb.machines.saveAll(mockDb.machines.getAll().filter((m) => m.id !== id));
    });
  }

  async update(
    id: string,
    data: Partial<Pick<Machine, "name" | "sectorId" | "customVariables" | "cardSettings">>,
  ): Promise<Machine> {
    return simulateNetwork(() => {
      const items = mockDb.machines.getAll();
      const index = items.findIndex((m) => m.id === id);
      const existing = items[index];
      if (index === -1 || !existing) throw new Error("Maquina nao encontrada.");
      const updated: Machine = { ...existing, ...data };
      const next = [...items];
      next[index] = updated;
      mockDb.machines.saveAll(next);
      return updated;
    });
  }

  async updateCardSettingsForAll(companyId: string, cardSettings: MachineCardSettings): Promise<Machine[]> {
    return simulateNetwork(() => {
      const items = mockDb.machines.getAll();
      const next = items.map((m) => (m.companyId === companyId ? { ...m, cardSettings } : m));
      mockDb.machines.saveAll(next);
      return next.filter((m) => m.companyId === companyId);
    });
  }
}
