import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { User } from "@/domain/entities/user";
import type { Company } from "@/domain/entities/company";

export function useCompany(companyId: string) {
  return useQuery({
    queryKey: ["company", companyId],
    queryFn: () => repositories.companies.getById(companyId),
  });
}

export function useCompanyUsers(companyId: string) {
  return useQuery({
    queryKey: ["users", companyId],
    queryFn: () => repositories.users.listByCompany(companyId),
  });
}

export function useUpdateCompanyLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, logoUrl }: { id: string; logoUrl: string }) => repositories.companies.updateLogo(id, logoUrl),
    onSuccess: (company: Company) => qc.invalidateQueries({ queryKey: ["company", company.id] }),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<User, "id" | "createdAt" | "avatarInitials">) => repositories.users.create(data),
    onSuccess: (user: User) => qc.invalidateQueries({ queryKey: ["users", user.companyId] }),
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; companyId: string }) => repositories.users.remove(id),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ["users", variables.companyId] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (password: string) => repositories.auth.changePassword(password),
  });
}
