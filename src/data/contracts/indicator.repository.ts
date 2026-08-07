import type { DashboardIndicators } from "@/domain/entities/indicator";

export interface IndicatorRepository {
  getDashboardIndicators(companyId: string): Promise<DashboardIndicators>;
}
