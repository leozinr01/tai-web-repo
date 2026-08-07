import type { MachineStatus } from "@/domain/types/enums";

export interface MachineVariables {
  horimeterHours: number;
  vibrationMm: number;
  temperatureC: number;
  speed: number;
  speedUnit: string;
  productionAmount: number;
  productionUnit: string;
}

export interface Machine {
  id: string;
  companyId: string;
  sectorId: string;
  name: string;
  code: string;
  status: MachineStatus;
  oeePercent: number;
  availabilityPercent: number;
  productivityPercent: number;
  qualityPercent: number;
  variables: MachineVariables;
  complementaryCount: number;
  oeeHistory: number[];
}
