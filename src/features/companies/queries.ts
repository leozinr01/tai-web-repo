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
