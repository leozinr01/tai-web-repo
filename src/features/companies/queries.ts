import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { Company } from "@/domain/entities/company";

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

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.companies.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCreateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { companyId: string; name: string }) => repositories.sectors.create(data),
    // A lista de empresas recalcula as contagens de setores e maquinas ao recarregar.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sectors"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, companyId, name }: { id: string; companyId: string; name: string }) =>
      repositories.sectors.update(id, companyId, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sectors"] }),
  });
}

export function useDeleteSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: string }) => repositories.sectors.remove(id, companyId),
    // A lista de empresas recalcula as contagens de setores e maquinas ao recarregar.
    onSuccess: () => {
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
    // A lista de empresas recalcula as contagens de setores e maquinas ao recarregar.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; companyId: string }) => repositories.machines.remove(id),
    // A lista de empresas recalcula as contagens de setores e maquinas ao recarregar.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["machines"] });
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
