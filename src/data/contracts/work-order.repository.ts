import type { WorkOrder } from "@/domain/entities/work-order";

export interface WorkOrderFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: WorkOrder["status"];
  sectorId?: string;
  machineId?: string;
  search?: string;
}

export interface WorkOrderRepository {
  list(companyId: string, filters?: WorkOrderFilters): Promise<WorkOrder[]>;
  getById(id: string): Promise<WorkOrder | null>;
  create(data: Omit<WorkOrder, "id" | "number" | "createdAt" | "updatedAt" | "companyId" | "executorName">): Promise<WorkOrder>;
  update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder>;
  remove(id: string): Promise<void>;
}
