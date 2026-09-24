import type { Machine, MachineCardSettings, MachineLossMetric } from "@/domain/entities/machine";

export interface MachineFilters {
  sectorId?: string;
  machineId?: string;
  status?: Machine["status"];
  highVibration?: boolean;
  highTemperature?: boolean;
}

export interface MachineRepository {
  /** `companyId` undefined = sem filtro por empresa (visao "todas as empresas", usada pelo Master). */
  listByCompany(companyId: string | undefined, filters?: MachineFilters): Promise<Machine[]>;
  getById(id: string): Promise<Machine | null>;
  create(data: { companyId: string; sectorId: string; name: string }): Promise<Machine>;
  update(
    id: string,
    data: Partial<Pick<Machine, "name" | "sectorId" | "customVariables" | "cardSettings" | "productionConfig">>,
  ): Promise<Machine>;
  remove(id: string): Promise<void>;
  updateCardSettingsForAll(companyId: string, cardSettings: MachineCardSettings): Promise<Machine[]>;
  /** Soma `minutes` na categoria de perda informada e recalcula/persiste os percentuais de OEE da maquina. */
  registerLoss(machineId: string, metric: MachineLossMetric, categoryKey: string, minutes: number): Promise<Machine>;
}
