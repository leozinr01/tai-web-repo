import type { Sector } from "@/domain/entities/sector";

export const seedSectors: Sector[] = [
  { id: "sector_acabamento", companyId: "company_tai", name: "Acabamento" },
  { id: "sector_central_gases_smh", companyId: "company_tai", name: "Central de Gases Solidaire (SMH)" },
  { id: "sector_central_gases_sjm", companyId: "company_tai", name: "Central de Gases Solidaire (SJM)" },
  { id: "sector_congelamento", companyId: "company_tai", name: "Congelamento" },
  { id: "sector_embalagem", companyId: "company_tai", name: "Embalagem" },
  { id: "sector_impressao", companyId: "company_tai", name: "Impressão" },
  { id: "sector_materia_prima", companyId: "company_tai", name: "Matéria prima" },
  { id: "sector_producao", companyId: "company_tai", name: "Produção" },

  { id: "sector_smh_1", companyId: "company_solidaire_smh", name: "Central de Gases Solidaire (SMH)" },
  { id: "sector_hospital_1", companyId: "company_solidaire_hospital", name: "Central de Gases Solidaire (SJM)" },

  { id: "sector_elder_1", companyId: "company_elder_marx", name: "Produção" },
  { id: "sector_elder_2", companyId: "company_elder_marx", name: "Manutenção" },
  { id: "sector_elder_3", companyId: "company_elder_marx", name: "Qualidade" },
];
