/**
 * "Banco" mockado em memoria/localStorage. Centraliza leitura e escrita dos
 * dados simulados para que os adaptadores mockados nunca leiam os arquivos de
 * seed diretamente apos a primeira inicializacao (assim as edicoes do usuario
 * persistem entre navegacoes/recarregamentos).
 */
import { storage, STORAGE_KEYS } from "@/lib/storage";
import { seedCompanies } from "@/data/mocks/seed-companies";
import { seedUsers } from "@/data/mocks/seed-users";
import { seedSectors } from "@/data/mocks/seed-sectors";
import { seedMachines } from "@/data/mocks/seed-machines";
import { seedAppointments } from "@/data/mocks/seed-appointments";
import { seedWorkOrders } from "@/data/mocks/seed-work-orders";
import type { Company } from "@/domain/entities/company";
import type { User } from "@/domain/entities/user";
import type { Sector } from "@/domain/entities/sector";
import type { Machine } from "@/domain/entities/machine";
import type { Appointment } from "@/domain/entities/appointment";
import type { WorkOrder } from "@/domain/entities/work-order";

function ensure<T>(key: string, seed: T[]): T[] {
  const existing = storage.get<T[] | null>(key, null);
  if (existing && existing.length > 0) return existing;
  storage.set(key, seed);
  return seed;
}

export const mockDb = {
  companies: {
    getAll(): Company[] {
      return ensure(STORAGE_KEYS.COMPANIES, seedCompanies);
    },
    saveAll(items: Company[]): void {
      storage.set(STORAGE_KEYS.COMPANIES, items);
    },
  },
  users: {
    getAll(): User[] {
      return ensure(STORAGE_KEYS.USERS, seedUsers);
    },
    saveAll(items: User[]): void {
      storage.set(STORAGE_KEYS.USERS, items);
    },
  },
  sectors: {
    getAll(): Sector[] {
      return ensure(STORAGE_KEYS.SECTORS, seedSectors);
    },
    saveAll(items: Sector[]): void {
      storage.set(STORAGE_KEYS.SECTORS, items);
    },
  },
  machines: {
    getAll(): Machine[] {
      return ensure(STORAGE_KEYS.MACHINES, seedMachines);
    },
    saveAll(items: Machine[]): void {
      storage.set(STORAGE_KEYS.MACHINES, items);
    },
  },
  appointments: {
    getAll(): Appointment[] {
      return ensure(STORAGE_KEYS.APPOINTMENTS, seedAppointments);
    },
    saveAll(items: Appointment[]): void {
      storage.set(STORAGE_KEYS.APPOINTMENTS, items);
    },
  },
  workOrders: {
    getAll(): WorkOrder[] {
      return ensure(STORAGE_KEYS.WORK_ORDERS, seedWorkOrders);
    },
    saveAll(items: WorkOrder[]): void {
      storage.set(STORAGE_KEYS.WORK_ORDERS, items);
    },
  },
};
