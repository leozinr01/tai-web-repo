import { useQuery } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { MachineFilters } from "@/data/contracts/machine.repository";

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
