import type { Machine, MachineCardSettings } from "@/domain/entities/machine";

export interface MachineFilters {
  sectorId?: string;
  machineId?: string;
  status?: Machine["status"];
  highVibration?: boolean;
  highTemperature?: boolean;
}

export interface MachineRepository {
  listByCompany(companyId: string, filters?: MachineFilters): Promise<Machine[]>;
  getById(id: string): Promise<Machine | null>;
  create(data: { companyId: string; sectorId: string; name: string }): Promise<Machine>;
  update(
    id: string,
    data: Partial<Pick<Machine, "name" | "sectorId" | "customVariables" | "cardSettings">>,
  ): Promise<Machine>;
  remove(id: string): Promise<void>;
  updateCardSettingsForAll(companyId: string, cardSettings: MachineCardSettings): Promise<Machine[]>;
}
