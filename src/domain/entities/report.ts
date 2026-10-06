export interface ReportRow {
  id: string;
  datetime: string;
  sectorId: string;
  sectorName: string;
  machineId: string;
  machineName: string;
  oee: number;
  availability: number;
  productivity: number;
  quality: number;
  horimeterHours: number;
  vibrationMax: number;
  temperatureMax: number;
  production: number;
  productionUnit: string;
  additionalVariablesCount: number;
  /** Todas as variaveis gravadas no registro, com o nome original e o valor ja formatado para exibicao. */
  additionalVariables: { label: string; value: string }[];
}
