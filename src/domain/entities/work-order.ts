import type { WorkOrderStatus } from "@/domain/types/enums";

export interface WorkOrder {
  id: string;
  companyId: string;
  number: string; // #YYYYMMDDHHmmss
  machineId: string;
  sectorId: string;
  executorId: string;
  executorName: string;
  description: string;
  date: string; // yyyy-MM-dd
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;
}
