import type { CompanyRepository, ListCompaniesParams } from "@/data/contracts/company.repository";
import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid } from "@/lib/utils";

export class MockCompanyRepository implements CompanyRepository {
  async list(params?: ListCompaniesParams): Promise<Company[]> {
    return simulateNetwork(() => {
      let items = mockDb.companies.getAll();
      if (params?.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
        );
      }
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  async getById(id: string): Promise<Company | null> {
    return simulateNetwork(() => mockDb.companies.getAll().find((c) => c.id === id) ?? null);
  }

  async create(data: Omit<Company, "id" | "createdAt" | "sectorsCount" | "machinesCount">): Promise<Company> {
    return simulateNetwork(() => {
      const items = mockDb.companies.getAll();
      const exists = items.some((c) => c.email.toLowerCase() === data.email.toLowerCase());
      if (exists) throw new Error("Ja existe uma empresa cadastrada com este e-mail.");
      const company: Company = {
        ...data,
        id: uid("company"),
        sectorsCount: 0,
        machinesCount: 0,
        createdAt: new Date().toISOString(),
      };
      mockDb.companies.saveAll([...items, company]);
      return company;
    });
  }

  async update(id: string, data: Partial<Company>): Promise<Company> {
    return simulateNetwork(() => {
      const items = mockDb.companies.getAll();
      const idx = items.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Empresa nao encontrada.");
      const current = items[idx];
      if (!current) throw new Error("Empresa nao encontrada.");
      const updated: Company = { ...current, ...data };
      const next = [...items];
      next[idx] = updated;
      mockDb.companies.saveAll(next);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return simulateNetwork(() => {
      const items = mockDb.companies.getAll().filter((c) => c.id !== id);
      mockDb.companies.saveAll(items);
    });
  }

  async updateLogo(id: string, logoUrl: string): Promise<Company> {
    return this.update(id, { logoUrl });
  }

  async toggleStatus(id: string): Promise<Company> {
    return simulateNetwork(() => {
      const items = mockDb.companies.getAll();
      const idx = items.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Empresa nao encontrada.");
      const current = items[idx];
      if (!current) throw new Error("Empresa nao encontrada.");
      const updated: Company = {
        ...current,
        status: current.status === CompanyStatus.ACTIVE ? CompanyStatus.INACTIVE : CompanyStatus.ACTIVE,
      };
      const next = [...items];
      next[idx] = updated;
      mockDb.companies.saveAll(next);
      return updated;
    });
  }
}
