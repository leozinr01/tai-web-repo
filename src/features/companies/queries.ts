import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";

const KEY = "companies";

export function useCompanies(search: string) {
  return useQuery({
    queryKey: [KEY, search],
    queryFn: () => repositories.companies.list({ search: search || undefined }),
  });
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Company, "id" | "createdAt" | "sectorsCount" | "machinesCount">) =>
      repositories.companies.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) => repositories.companies.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useToggleCompanyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (company: Company) =>
      repositories.companies.update(company.id, {
        status: company.status === CompanyStatus.ACTIVE ? CompanyStatus.INACTIVE : CompanyStatus.ACTIVE,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.companies.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

async function syncCompanyCounts(companyId: string) {
  const [sectors, machines] = await Promise.all([
    repositories.sectors.listByCompany(companyId),
    repositories.machines.listByCompany(companyId),
  ]);
  await repositories.companies.update(companyId, {
    sectorsCount: sectors.length,
    machinesCount: machines.length,
  });
}

export function useCreateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { companyId: string; name: string }) => repositories.sectors.create(data),
    onSuccess: async (_result, variables) => {
      await syncCompanyCounts(variables.companyId);
      qc.invalidateQueries({ queryKey: ["sectors"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => repositories.sectors.update(id, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sectors"] }),
  });
}

export function useDeleteSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; companyId: string }) => repositories.sectors.remove(id),
    onSuccess: async (_result, variables) => {
      await syncCompanyCounts(variables.companyId);
      qc.invalidateQueries({ queryKey: ["sectors"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useCreateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { companyId: string; sectorId: string; name: string }) =>
      repositories.machines.create(data),
    onSuccess: async (_result, variables) => {
      await syncCompanyCounts(variables.companyId);
      qc.invalidateQueries({ queryKey: ["machines"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; companyId: string }) => repositories.machines.remove(id),
    onSuccess: async (_result, variables) => {
      await syncCompanyCounts(variables.companyId);
      qc.invalidateQueries({ queryKey: ["machines"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
