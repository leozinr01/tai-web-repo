import type { ReportFilters, ReportRepository } from "@/data/contracts/report.repository";
import type { ReportRow } from "@/domain/entities/report";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid } from "@/lib/utils";
import { format, subHours } from "date-fns";

export class MockReportRepository implements ReportRepository {
  async list(companyId: string, filters?: ReportFilters): Promise<ReportRow[]> {
    return simulateNetwork(() => {
      const machines = mockDb.machines.getAll().filter((m) => m.companyId === companyId);
      const sectors = mockDb.sectors.getAll();

      let filteredMachines = machines;
      if (filters?.sectorId) filteredMachines = filteredMachines.filter((m) => m.sectorId === filters.sectorId);
      if (filters?.machineId) filteredMachines = filteredMachines.filter((m) => m.id === filters.machineId);

      const rows: ReportRow[] = [];
      const now = new Date();

      filteredMachines.forEach((machine) => {
        const sector = sectors.find((s) => s.id === machine.sectorId);
        for (let h = 0; h < 8; h++) {
          const dt = subHours(now, h);
          const dateStr = format(dt, "yyyy-MM-dd");
          if (filters?.from && dateStr < filters.from) continue;
          if (filters?.to && dateStr > filters.to) continue;
          rows.push({
            id: uid("report"),
            datetime: dt.toISOString(),
            sectorId: machine.sectorId,
            sectorName: sector?.name ?? "-",
            machineId: machine.id,
            machineName: machine.name,
            oee: machine.oeePercent,
            availability: machine.availabilityPercent,
            productivity: machine.productivityPercent,
            quality: machine.qualityPercent,
            horimeterHours: machine.variables.horimeterHours - h,
            vibrationMax: machine.variables.vibrationMm,
            temperatureMax: machine.variables.temperatureC,
            production: machine.variables.productionAmount,
            productionUnit: machine.variables.productionUnit,
            additionalVariablesCount: machine.complementaryCount + 1,
          });
        }
      });

      return rows.sort((a, b) => (a.datetime < b.datetime ? 1 : -1));
    });
  }
}
