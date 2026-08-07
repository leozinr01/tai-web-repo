import type { Appointment } from "@/domain/entities/appointment";

export interface AppointmentFilters {
  dateFrom?: string;
  dateTo?: string;
  sectorId?: string;
  machineId?: string;
  authorId?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppointmentRepository {
  list(companyId: string, filters?: AppointmentFilters): Promise<PagedResult<Appointment>>;
  getById(id: string): Promise<Appointment | null>;
  create(data: Omit<Appointment, "id" | "createdAt" | "companyId" | "authorName">): Promise<Appointment>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment>;
  remove(id: string): Promise<void>;
}
