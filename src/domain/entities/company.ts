import type { CompanyStatus } from "@/domain/types/enums";

export interface Company {
  id: string;
  name: string;
  email: string;
  logoUrl?: string;
  status: CompanyStatus;
  sectorsCount: number;
  machinesCount: number;
  createdAt: string;
}
