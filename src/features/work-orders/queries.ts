import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import { useLiveInvalidation } from "@/hooks/use-live-invalidation";
import type { WorkOrderFilters } from "@/data/contracts/work-order.repository";
import type { WorkOrder } from "@/domain/entities/work-order";

const KEY = "work-orders";

const watchWorkOrders = (companyId: string, onChange: () => void) =>
  repositories.workOrders.watch(companyId, onChange);

export function useWorkOrders(companyId: string, filters: WorkOrderFilters) {
  useLiveInvalidation(watchWorkOrders, KEY, companyId);
  return useQuery({
    queryKey: [KEY, companyId, filters],
    queryFn: () => repositories.workOrders.list(companyId, filters),
  });
}

export function useCreateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkOrder, "id" | "number" | "createdAt" | "updatedAt" | "companyId" | "executorName">) =>
      repositories.workOrders.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkOrder> }) =>
      repositories.workOrders.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.workOrders.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
