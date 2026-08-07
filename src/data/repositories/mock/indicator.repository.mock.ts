import type { IndicatorRepository } from "@/data/contracts/indicator.repository";
import type { DashboardIndicators, IndicatorPoint } from "@/domain/entities/indicator";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork } from "@/lib/utils";

function buildHistory(base: number): IndicatorPoint[] {
  return Array.from({ length: 7 }, (_, i) => ({
    label: `D${i + 1}`,
    value: Math.max(60, Math.min(100, base + Math.round((Math.random() - 0.5) * 12))),
  }));
}

export class MockIndicatorRepository implements IndicatorRepository {
  async getDashboardIndicators(companyId: string): Promise<DashboardIndicators> {
    return simulateNetwork(() => {
      const machines = mockDb.machines.getAll().filter((m) => m.companyId === companyId);
      const avg = (values: number[]) =>
        values.length === 0 ? 0 : Math.round(values.reduce((a, b) => a + b, 0) / values.length);

      const oee = avg(machines.map((m) => m.oeePercent));
      const availability = avg(machines.map((m) => m.availabilityPercent));
      const productivity = avg(machines.map((m) => m.productivityPercent));
      const quality = avg(machines.map((m) => m.qualityPercent));

      return {
        oee,
        availability,
        productivity,
        quality,
        oeeHistory: buildHistory(oee),
        availabilityHistory: buildHistory(availability),
        productivityHistory: buildHistory(productivity),
        qualityHistory: buildHistory(quality),
      };
    });
  }
}
