import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repositories } from "@/data/repositories";
import type { AppointmentFilters } from "@/data/contracts/appointment.repository";
import type { Appointment } from "@/domain/entities/appointment";

const KEY = "appointments";

export function useAppointments(companyId: string, filters: AppointmentFilters) {
  return useQuery({
    queryKey: [KEY, companyId, filters],
    queryFn: () => repositories.appointments.list(companyId, filters),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Appointment, "id" | "createdAt" | "companyId" | "authorName">) =>
      repositories.appointments.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      repositories.appointments.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.appointments.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
