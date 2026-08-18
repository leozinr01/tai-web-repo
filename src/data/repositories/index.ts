/**
 * Ponto unico de resolucao dos repositorios.
 *
 * Todos os dominios (auth, companies, users, sectors, machines, indicators,
 * workOrders, appointments, reports) usam dados mockados (localStorage).
 */
import { MockAuthRepository } from "@/data/repositories/mock/auth.repository.mock";
import { MockCompanyRepository } from "@/data/repositories/mock/company.repository.mock";
import { MockUserRepository } from "@/data/repositories/mock/user.repository.mock";
import { MockSectorRepository } from "@/data/repositories/mock/sector.repository.mock";
import { MockMachineRepository } from "@/data/repositories/mock/machine.repository.mock";
import { MockIndicatorRepository } from "@/data/repositories/mock/indicator.repository.mock";
import { MockWorkOrderRepository } from "@/data/repositories/mock/work-order.repository.mock";
import { MockAppointmentRepository } from "@/data/repositories/mock/appointment.repository.mock";
import { MockReportRepository } from "@/data/repositories/mock/report.repository.mock";

export const repositories = {
  auth: new MockAuthRepository(),
  companies: new MockCompanyRepository(),
  users: new MockUserRepository(),
  sectors: new MockSectorRepository(),
  machines: new MockMachineRepository(),
  indicators: new MockIndicatorRepository(),
  appointments: new MockAppointmentRepository(),
  workOrders: new MockWorkOrderRepository(),
  reports: new MockReportRepository(),
};
