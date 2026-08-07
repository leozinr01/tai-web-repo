import type { AppointmentArea } from "@/domain/types/enums";

export interface Appointment {
  id: string;
  companyId: string;
  sectorId: string;
  machineId: string;
  area: AppointmentArea;
  affectedSegment: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  durationMinutes: number;
  authorId: string;
  authorName: string;
  description: string;
  createdAt: string;
}
