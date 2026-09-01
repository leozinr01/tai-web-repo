import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";

export const seedCompanies: Company[] = [
  {
    id: "company_tai",
    name: "Tai Project",
    email: "app@taiproject.com.br",
    logoUrl: "/logo-tai-project.png",
    status: CompanyStatus.ACTIVE,
    sectorsCount: 8,
    machinesCount: 35,
    createdAt: "2024-02-10T10:00:00.000Z",
  },
  {
    id: "company_solidaire_smh",
    name: "Solidaire - SMH",
    email: "contato@solidaire-smh.com.br",
    logoUrl: "",
    status: CompanyStatus.ACTIVE,
    sectorsCount: 1,
    machinesCount: 4,
    createdAt: "2024-05-22T10:00:00.000Z",
  },
  {
    id: "company_solidaire_hospital",
    name: "Solidaire - Hospital Municipal SJM",
    email: "contato@hospitalsjm.com.br",
    logoUrl: "",
    status: CompanyStatus.ACTIVE,
    sectorsCount: 1,
    machinesCount: 7,
    createdAt: "2024-06-15T10:00:00.000Z",
  },
  {
    id: "company_elder_marx",
    name: "Elder Marx Inc",
    email: "contato@eldermarx.com",
    logoUrl: "",
    status: CompanyStatus.ACTIVE,
    sectorsCount: 3,
    machinesCount: 2,
    createdAt: "2024-09-01T10:00:00.000Z",
  },
];
