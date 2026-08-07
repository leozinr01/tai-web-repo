import type { ReportRow } from "@/domain/entities/report";

export interface ReportFilters {
  from?: string;
  to?: string;
  sectorId?: string;
  machineId?: string;
}

export interface ReportRepository {
  list(companyId: string, filters?: ReportFilters): Promise<ReportRow[]>;
}
