import type { WorkOrderFilters, WorkOrderRepository } from "@/data/contracts/work-order.repository";
import type { WorkOrder } from "@/domain/entities/work-order";
import { supabase } from "@/lib/supabase/client";
import {
  mapWorkOrderRow,
  mapWorkOrderStatusToDb,
  mapWorkOrderStatusToDbList,
} from "@/lib/supabase/mappers";
import { buildNameToId, getCompanyMachines, resolveMachineName } from "@/lib/supabase/machine-lookup";
import { lookupUserName } from "@/lib/supabase/user-lookup";
import type { Tables } from "@/lib/supabase/database.types";

export class SupabaseWorkOrderRepository implements WorkOrderRepository {
  async list(companyId: string, filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    const machines = await getCompanyMachines(companyId);
    const nameToId = buildNameToId(machines);

    let query = supabase.from("Ordem de serviço").select("*").eq("idRef", companyId);

    if (filters?.dateFrom) query = query.gte("data", filters.dateFrom);
    if (filters?.dateTo) query = query.lte("data", filters.dateTo);
    if (filters?.status) query = query.in("status", mapWorkOrderStatusToDbList(filters.status));
    if (filters?.sectorId) query = query.eq("setor", filters.sectorId);
    if (filters?.machineId) {
      const machineName = machines.find((m) => String(m.id) === filters.machineId)?.maquina;
      query = query.eq("idMaquina", machineName ?? filters.machineId);
    }
    if (filters?.search) query = query.ilike("servico", `%${filters.search}%`);

    const { data, error } = await query.order("data", { ascending: false });
    if (error) throw new Error("Nao foi possivel carregar as ordens de servico.");
    return (data ?? []).map((row: Tables<"Ordem de serviço">) => mapWorkOrderRow(row, companyId, nameToId));
  }

  async getById(id: string): Promise<WorkOrder | null> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return null;
    const { data, error } = await supabase
      .from("Ordem de serviço")
      .select("*")
      .eq("id", numericId)
      .maybeSingle();
    if (error || !data || !data.idRef) return null;

    const machines = await getCompanyMachines(data.idRef);
    return mapWorkOrderRow(data, data.idRef, buildNameToId(machines));
  }

  async create(
    data: Omit<WorkOrder, "id" | "number" | "createdAt" | "updatedAt" | "companyId" | "executorName">,
  ): Promise<WorkOrder> {
    const [{ name: machineName, companyId }, executorName] = await Promise.all([
      resolveMachineName(data.machineId),
      lookupUserName(data.executorId),
    ]);

    const { data: row, error } = await supabase
      .from("Ordem de serviço")
      .insert({
        idMaquina: machineName,
        setor: data.sectorId,
        Executor: executorName,
        servico: data.description,
        data: data.date,
        status: mapWorkOrderStatusToDb(data.status),
        idRef: companyId,
      })
      .select("*")
      .single();

    if (error || !row) throw new Error("Nao foi possivel criar a ordem de servico.");
    return mapWorkOrderRow(row, companyId, new Map([[machineName, data.machineId]]));
  }

  async update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) throw new Error("Ordem de servico invalida.");

    const patch: Record<string, unknown> = {};
    let resolvedMachineName: string | undefined;
    if (data.machineId !== undefined) {
      const resolved = await resolveMachineName(data.machineId);
      resolvedMachineName = resolved.name;
      patch.idMaquina = resolved.name;
    }
    if (data.sectorId !== undefined) patch.setor = data.sectorId;
    if (data.description !== undefined) patch.servico = data.description;
    if (data.date !== undefined) patch.data = data.date;
    if (data.status !== undefined) patch.status = mapWorkOrderStatusToDb(data.status);
    if (data.executorId !== undefined) {
      patch.Executor = await lookupUserName(data.executorId);
    }

    const { data: row, error } = await supabase
      .from("Ordem de serviço")
      .update(patch)
      .eq("id", numericId)
      .select("*")
      .single();

    if (error || !row || !row.idRef) throw new Error("Nao foi possivel atualizar a ordem de servico.");

    const machines = await getCompanyMachines(row.idRef);
    const nameToId = buildNameToId(machines);
    if (resolvedMachineName && data.machineId) nameToId.set(resolvedMachineName, data.machineId);
    return mapWorkOrderRow(row, row.idRef, nameToId);
  }

  async remove(id: string): Promise<void> {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) throw new Error("Ordem de servico invalida.");
    const { error } = await supabase.from("Ordem de serviço").delete().eq("id", numericId);
    if (error) throw new Error("Nao foi possivel remover a ordem de servico.");
  }
}
