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
}
