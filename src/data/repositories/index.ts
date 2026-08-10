/**
 * Ponto unico de resolucao dos repositorios.
 *
 * Todos os dominios (auth, companies, users, sectors, machines, indicators,
 * workOrders, appointments, reports) ja usam o Supabase real (projeto "TAI").
 */
import { SupabaseAuthRepository } from "@/data/repositories/supabase/auth.repository.supabase";
import { SupabaseCompanyRepository } from "@/data/repositories/supabase/company.repository.supabase";
import { SupabaseUserRepository } from "@/data/repositories/supabase/user.repository.supabase";
import { SupabaseSectorRepository } from "@/data/repositories/supabase/sector.repository.supabase";
import { SupabaseMachineRepository } from "@/data/repositories/supabase/machine.repository.supabase";
import { SupabaseIndicatorRepository } from "@/data/repositories/supabase/indicator.repository.supabase";
import { SupabaseWorkOrderRepository } from "@/data/repositories/supabase/work-order.repository.supabase";
import { SupabaseAppointmentRepository } from "@/data/repositories/supabase/appointment.repository.supabase";
import { SupabaseReportRepository } from "@/data/repositories/supabase/report.repository.supabase";

export const repositories = {
  auth: new SupabaseAuthRepository(),
  companies: new SupabaseCompanyRepository(),
  users: new SupabaseUserRepository(),
  sectors: new SupabaseSectorRepository(),
  machines: new SupabaseMachineRepository(),
  indicators: new SupabaseIndicatorRepository(),
  appointments: new SupabaseAppointmentRepository(),
  workOrders: new SupabaseWorkOrderRepository(),
  reports: new SupabaseReportRepository(),
};
