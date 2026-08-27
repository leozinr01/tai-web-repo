import type { WorkOrderFilters, WorkOrderRepository } from "@/data/contracts/work-order.repository";
import type { WorkOrder } from "@/domain/entities/work-order";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid } from "@/lib/utils";
import { format } from "date-fns";

function generateNumber(): string {
  return `#${format(new Date(), "yyyyMMddHHmmss")}`;
}

export class MockWorkOrderRepository implements WorkOrderRepository {
  async list(companyId: string, filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    return simulateNetwork(() => {
      let items = mockDb.workOrders.getAll().filter((w) => w.companyId === companyId);
      if (filters?.dateFrom) items = items.filter((w) => w.date >= filters.dateFrom!);
      if (filters?.dateTo) items = items.filter((w) => w.date <= filters.dateTo!);
      if (filters?.status) items = items.filter((w) => w.status === filters.status);
      if (filters?.sectorId) items = items.filter((w) => w.sectorId === filters.sectorId);
      if (filters?.machineId) items = items.filter((w) => w.machineId === filters.machineId);
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        items = items.filter(
          (w) => w.number.toLowerCase().includes(q) || w.description.toLowerCase().includes(q),
        );
      }
      return [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
    });
  }

  async getById(id: string): Promise<WorkOrder | null> {
    return simulateNetwork(() => mockDb.workOrders.getAll().find((w) => w.id === id) ?? null);
  }

  async create(
    data: Omit<WorkOrder, "id" | "number" | "createdAt" | "updatedAt" | "companyId" | "executorName">,
  ): Promise<WorkOrder> {
    return simulateNetwork(() => {
      const executor = mockDb.users.getAll().find((u) => u.id === data.executorId);
      const now = new Date().toISOString();
      const order: WorkOrder = {
        ...data,
        id: uid("wo"),
        number: generateNumber(),
        companyId: executor?.companyId ?? "company_tai",
        executorName: executor?.name ?? "Desconhecido",
        createdAt: now,
        updatedAt: now,
      };
      mockDb.workOrders.saveAll([...mockDb.workOrders.getAll(), order]);
      return order;
    });
  }

  async update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    return simulateNetwork(() => {
      const items = mockDb.workOrders.getAll();
      const idx = items.findIndex((w) => w.id === id);
      if (idx === -1) throw new Error("Ordem de servico nao encontrada.");
      const current = items[idx];
      if (!current) throw new Error("Ordem de servico nao encontrada.");
      let executorName = data.executorName ?? current.executorName;
      if (data.executorId && data.executorId !== current.executorId) {
        const executor = mockDb.users.getAll().find((u) => u.id === data.executorId);
        executorName = executor?.name ?? executorName;
      }
      const updated: WorkOrder = {
        ...current,
        ...data,
        executorName,
        updatedAt: new Date().toISOString(),
      };
      const next = [...items];
      next[idx] = updated;
      mockDb.workOrders.saveAll(next);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return simulateNetwork(() => {
      mockDb.workOrders.saveAll(mockDb.workOrders.getAll().filter((w) => w.id !== id));
    });
  }
}
