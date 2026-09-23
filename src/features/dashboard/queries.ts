import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { MachineFilters } from "@/data/contracts/machine.repository";
import type { Machine, MachineCardSettings, MachineLossMetric } from "@/domain/entities/machine";

export function useDashboardIndicators(companyId: string) {
  return useQuery({
    queryKey: ["dashboard-indicators", companyId],
    queryFn: () => repositories.indicators.getDashboardIndicators(companyId),
    refetchOnMount: "always",
  });
}

export function useMachines(companyId: string | undefined, filters: MachineFilters) {
  return useQuery({
    queryKey: ["machines", companyId, filters],
    queryFn: () => repositories.machines.listByCompany(companyId, filters),
    refetchOnMount: "always",
  });
}

export function useSectors(companyId: string | undefined) {
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
      data: Partial<Pick<Machine, "name" | "sectorId" | "customVariables" | "cardSettings" | "productionConfig">>;
    }) => repositories.machines.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["machines"] }),
  });
}

export function useUpdateAllMachinesCardSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, cardSettings }: { companyId: string; cardSettings: MachineCardSettings }) =>
      repositories.machines.updateCardSettingsForAll(companyId, cardSettings),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["machines"] }),
  });
}

export function useRegisterMachineLoss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      machineId,
      metric,
      categoryKey,
      minutes,
    }: {
      machineId: string;
      metric: MachineLossMetric;
      categoryKey: string;
      minutes: number;
    }) => repositories.machines.registerLoss(machineId, metric, categoryKey, minutes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["machines"] }),
  });
}
