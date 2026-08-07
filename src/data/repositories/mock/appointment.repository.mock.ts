import type {
  AppointmentFilters,
  AppointmentRepository,
  PagedResult,
} from "@/data/contracts/appointment.repository";
import type { Appointment } from "@/domain/entities/appointment";
import { mockDb } from "@/data/repositories/mock/mock-db";
import { simulateNetwork, uid } from "@/lib/utils";

export class MockAppointmentRepository implements AppointmentRepository {
  async list(companyId: string, filters?: AppointmentFilters): Promise<PagedResult<Appointment>> {
    return simulateNetwork(() => {
      let items = mockDb.appointments.getAll().filter((a) => a.companyId === companyId);
      if (filters?.dateFrom) items = items.filter((a) => a.date >= filters.dateFrom!);
      if (filters?.dateTo) items = items.filter((a) => a.date <= filters.dateTo!);
      if (filters?.sectorId) items = items.filter((a) => a.sectorId === filters.sectorId);
      if (filters?.machineId) items = items.filter((a) => a.machineId === filters.machineId);
      if (filters?.authorId) items = items.filter((a) => a.authorId === filters.authorId);

      items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

      const page = filters?.page ?? 1;
      const pageSize = filters?.pageSize ?? 8;
      const total = items.length;
      const start = (page - 1) * pageSize;
      const pageItems = items.slice(start, start + pageSize);

      return { items: pageItems, total, page, pageSize };
    });
  }

  async getById(id: string): Promise<Appointment | null> {
    return simulateNetwork(() => mockDb.appointments.getAll().find((a) => a.id === id) ?? null);
  }

  async create(
    data: Omit<Appointment, "id" | "createdAt" | "companyId" | "authorName">,
  ): Promise<Appointment> {
    return simulateNetwork(() => {
      const users = mockDb.users.getAll();
      const author = users.find((u) => u.id === data.authorId);
      const appointment: Appointment = {
        ...data,
        id: uid("appt"),
        companyId: author?.companyId ?? "company_tai",
        authorName: author?.name ?? "Desconhecido",
        createdAt: new Date().toISOString(),
      };
      mockDb.appointments.saveAll([...mockDb.appointments.getAll(), appointment]);
      return appointment;
    });
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    return simulateNetwork(() => {
      const items = mockDb.appointments.getAll();
      const idx = items.findIndex((a) => a.id === id);
      if (idx === -1) throw new Error("Apontamento nao encontrado.");
      const current = items[idx];
      if (!current) throw new Error("Apontamento nao encontrado.");
      let authorName = current.authorName;
      if (data.authorId && data.authorId !== current.authorId) {
        const author = mockDb.users.getAll().find((u) => u.id === data.authorId);
        authorName = author?.name ?? authorName;
      }
      const updated: Appointment = { ...current, ...data, authorName };
      const next = [...items];
      next[idx] = updated;
      mockDb.appointments.saveAll(next);
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    return simulateNetwork(() => {
      mockDb.appointments.saveAll(mockDb.appointments.getAll().filter((a) => a.id !== id));
    });
  }
}
