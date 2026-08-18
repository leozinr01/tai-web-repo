import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { MachineFilters } from "@/data/contracts/machine.repository";
import type { Machine } from "@/domain/entities/machine";

export function useDashboardIndicators(companyId: string) {
  return useQuery({
    queryKey: ["dashboard-indicators", companyId],
    queryFn: () => repositories.indicators.getDashboardIndicators(companyId),
  });
}

export function useMachines(companyId: string, filters: MachineFilters) {
  return useQuery({
    queryKey: ["machines", companyId, filters],
    queryFn: () => repositories.machines.listByCompany(companyId, filters),
  });
}

export function useSectors(companyId: string) {
  return useQuery({
    queryKey: ["sectors", companyId],
    queryFn: () => repositories.sectors.listByCompany(companyId),
  });
}

export function useUpdateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<Machine, "name" | "sectorId" | "customVariables" | "cardSettings">>;
    }) => repositories.machines.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["machines"] }),
  });
}
