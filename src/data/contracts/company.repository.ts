import type { Company } from "@/domain/entities/company";

export interface ListCompaniesParams {
  search?: string;
}

export interface CompanyRepository {
  list(params?: ListCompaniesParams): Promise<Company[]>;
  getById(id: string): Promise<Company | null>;
  create(data: Omit<Company, "id" | "createdAt" | "sectorsCount" | "machinesCount">): Promise<Company>;
  update(id: string, data: Partial<Company>): Promise<Company>;
  remove(id: string): Promise<void>;
  updateLogo(id: string, logoUrl: string): Promise<Company>;
}
