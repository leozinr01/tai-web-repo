import type { Appointment } from "@/domain/entities/appointment";
import type { AppointmentArea } from "@/domain/types/enums";

export interface AppointmentFilters {
  dateFrom?: string;
  dateTo?: string;
  sectorId?: string;
  machineId?: string;
  authorId?: string;
  area?: AppointmentArea;
  affectedSegment?: string;
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
  /** `companyId` undefined = sem filtro por empresa (visao "todas as empresas", usada pelo Master). */
  list(companyId: string | undefined, filters?: AppointmentFilters): Promise<PagedResult<Appointment>>;
  getById(id: string): Promise<Appointment | null>;
  create(data: Omit<Appointment, "id" | "createdAt" | "companyId" | "authorName" | "completedAt">): Promise<Appointment>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment>;
  remove(id: string): Promise<void>;
  /** Chama `onChange` quando algum apontamento da empresa muda. Devolve a funcao para parar. */
  watch(companyId: string | undefined, onChange: () => void): () => void;
}
