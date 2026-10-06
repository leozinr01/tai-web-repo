import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { MachineFilters } from "@/data/contracts/machine.repository";
import type { Machine, MachineCardSettings, MachineLossMetric } from "@/domain/entities/machine";

// Intervalo de atualizacao automatica do dashboard (dados das maquinas mudam em tempo real).
export const DASHBOARD_REFRESH_MS = 5_000;

export function useDashboardIndicators(companyId: string) {
  return useQuery({
    queryKey: ["dashboard-indicators", companyId],
    queryFn: () => repositories.indicators.getDashboardIndicators(companyId),
    refetchOnMount: "always",
    refetchInterval: DASHBOARD_REFRESH_MS,
  });
}

export function useMachines(
  companyId: string | undefined,
  filters: MachineFilters,
  options: { refetchInterval?: number } = {},
) {
  return useQuery({
    queryKey: ["machines", companyId, filters],
    queryFn: () => repositories.machines.listByCompany(companyId, filters),
    refetchOnMount: "always",
    refetchInterval: options.refetchInterval,
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
