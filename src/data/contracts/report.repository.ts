import type { ReportRow } from "@/domain/entities/report";
import type { PagedResult } from "@/data/contracts/appointment.repository";

export interface ReportFilters {
  from?: string;
  to?: string;
  sectorId?: string;
  machineId?: string;
}

export interface ReportRepository {
  /** Uma pagina dos registros, mais recentes primeiro, com o total real para a paginacao. */
  /** `companyId` undefined = sem filtro por empresa (visao "todas as empresas", usada pelo Master). */
  list(companyId: string | undefined, filters: ReportFilters, page: number, pageSize: number): Promise<PagedResult<ReportRow>>;
  /** Todos os registros do filtro, para exportar. */
  listAll(companyId: string | undefined, filters: ReportFilters): Promise<ReportRow[]>;
}
