import type { Machine } from "@/domain/entities/machine";

export interface MachineFilters {
  sectorId?: string;
  status?: Machine["status"];
  highVibration?: boolean;
  highTemperature?: boolean;
}

export interface MachineRepository {
  listByCompany(companyId: string, filters?: MachineFilters): Promise<Machine[]>;
  getById(id: string): Promise<Machine | null>;
}
