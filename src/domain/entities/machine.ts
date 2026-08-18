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

export interface MachineCustomVariable {
  id: string;
  label: string;
  value: string;
}

/** Chaves das variaveis que podem aparecer nos cards do dashboard (builtin ou id de variavel customizada). */
export type MachineVariableKey =
  | "horimeter"
  | "vibration"
  | "temperature"
  | "speed"
  | "production"
  | (string & {});

export interface MachineCardSettings {
  showOeeCircle: boolean;
  topVariableKeys: [MachineVariableKey, MachineVariableKey, MachineVariableKey];
  bottomVariableKeys: [MachineVariableKey, MachineVariableKey];
  bottomVariableVisible: [boolean, boolean];
}

export interface MachineLossCategory {
  key: string;
  label: string;
  minutes: number;
}

export interface MachineLossBreakdown {
  availability: MachineLossCategory[];
  productivity: MachineLossCategory[];
  quality: MachineLossCategory[];
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
  customVariables: MachineCustomVariable[];
  cardSettings: MachineCardSettings;
  lossBreakdown: MachineLossBreakdown;
}
