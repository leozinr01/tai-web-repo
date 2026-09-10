import { format } from "date-fns";
import type { WorkOrderFilters, WorkOrderRepository } from "@/data/contracts/work-order.repository";
import type { WorkOrder } from "@/domain/entities/work-order";
import { WorkOrderPeriodicity, WorkOrderStatus } from "@/domain/types/enums";
import { supabase } from "@/lib/supabase-client";
import { workOrderPeriodicityLabels, workOrderStatusLabels } from "@/lib/labels";
import { getMachineNameMaps, getUserNameToId } from "@/data/repositories/supabase/company-lookups";

const TABLE = "Ordem de serviço";

interface OsRow {
  id: number;
  created_at: string;
  idRef: string;
  idMaquina: string | null;
  numOrdem: number | null;
  data: string | null;
  servico: string | null;
  periodicidade: string | null;
  status: string | null;
  Executor: string | null;
  setor: string | null;
  proxima_execucao: string | null;
}

const OS_COLUMNS =
  'id, created_at, "idRef", "idMaquina", "numOrdem", data, servico, periodicidade, status, "Executor", setor, proxima_execucao';

const PERIODICITY_BY_LABEL = new Map<string, WorkOrderPeriodicity>(
  Object.entries(workOrderPeriodicityLabels).map(([enumValue, label]) => [label, enumValue as WorkOrderPeriodicity]),
);
const STATUS_BY_LABEL = new Map<string, WorkOrderStatus>(
  Object.entries(workOrderStatusLabels).map(([enumValue, label]) => [label, enumValue as WorkOrderStatus]),
);

function periodicityFromDb(label: string | null): WorkOrderPeriodicity {
  return (label && PERIODICITY_BY_LABEL.get(label)) || WorkOrderPeriodicity.SEMANAL;
}
function statusFromDb(label: string | null): WorkOrderStatus {
  return (label && STATUS_BY_LABEL.get(label)) || WorkOrderStatus.LANCADA;
}

function toWorkOrder(row: OsRow, machineIdByName: Map<string, string>, userIdByName: Map<string, string>): WorkOrder {
  const now = new Date().toISOString();
  return {
    id: String(row.id),
    companyId: row.idRef,
    number: `#${row.numOrdem ?? row.id}`,
    machineId: machineIdByName.get(row.idMaquina ?? "") ?? "",
    sectorId: row.setor ?? "",
    executorId: userIdByName.get(row.Executor ?? "") ?? "",
    executorName: row.Executor ?? "",
    description: row.servico ?? "",
    date: row.proxima_execucao || row.data || "",
    periodicity: periodicityFromDb(row.periodicidade),
    status: statusFromDb(row.status),
    createdAt: row.created_at ?? now,
    updatedAt: row.created_at ?? now,
  };
}

export class SupabaseWorkOrderRepository implements WorkOrderRepository {
  async list(companyId: string, filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    const { data, error } = await supabase.from(TABLE).select(OS_COLUMNS).eq("idRef", companyId);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as OsRow[];

    const [{ nameToId }, userNameToId] = await Promise.all([
      getMachineNameMaps(companyId),
      getUserNameToId(companyId),
    ]);

    let items = rows.map((row) => toWorkOrder(row, nameToId, userNameToId));
    if (filters?.dateFrom) items = items.filter((w) => w.date >= filters.dateFrom!);
    if (filters?.dateTo) items = items.filter((w) => w.date <= filters.dateTo!);
    if (filters?.status) items = items.filter((w) => w.status === filters.status);
    if (filters?.sectorId) items = items.filter((w) => w.sectorId === filters.sectorId);
    if (filters?.machineId) items = items.filter((w) => w.machineId === filters.machineId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((w) => w.number.toLowerCase().includes(q) || w.description.toLowerCase().includes(q));
    }
    return items.sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async getById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase.from(TABLE).select(OS_COLUMNS).eq("id", Number(id)).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as OsRow;
    const [{ nameToId }, userNameToId] = await Promise.all([
      getMachineNameMaps(row.idRef),
      getUserNameToId(row.idRef),
    ]);
    return toWorkOrder(row, nameToId, userNameToId);
  }

  async create(
    data: Omit<WorkOrder, "id" | "number" | "createdAt" | "updatedAt" | "companyId" | "executorName">,
  ): Promise<WorkOrder> {
    const { data: executorRow, error: execError } = await supabase
      .from("User")
      .select("idRef, nomeUser, idEmpresa")
      .eq("idRef", data.executorId)
      .maybeSingle();
    if (execError) throw new Error(execError.message);
    const companyId = executorRow?.idEmpresa ?? "";
    const executorName = executorRow?.nomeUser ?? "Desconhecido";
    const { idToName } = await getMachineNameMaps(companyId);
    const numOrdem = Number(format(new Date(), "yyyyMMddHHmmss"));

    const { data: row, error } = await supabase
      .from(TABLE)
      .insert({
        idRef: companyId,
        idMaquina: idToName.get(data.machineId) ?? "",
        numOrdem,
        data: data.date,
        proxima_execucao: data.date,
        servico: data.description,
        periodicidade: workOrderPeriodicityLabels[data.periodicity],
        status: workOrderStatusLabels[data.status],
        Executor: executorName,
        setor: data.sectorId,
      })
      .select(OS_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    const [{ nameToId }, userNameToId] = await Promise.all([
      getMachineNameMaps(companyId),
      getUserNameToId(companyId),
    ]);
    return toWorkOrder(row as OsRow, nameToId, userNameToId);
  }

  async update(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
    const { data: current, error: fetchError } = await supabase
      .from(TABLE)
      .select(OS_COLUMNS)
      .eq("id", Number(id))
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!current) throw new Error("Ordem de servico nao encontrada.");
    const row = current as OsRow;
    const companyId = row.idRef;

    const patch: Record<string, unknown> = {};
    if (data.description !== undefined) patch.servico = data.description;
    if (data.date !== undefined) {
      patch.data = data.date;
      patch.proxima_execucao = data.date;
    }
    if (data.periodicity !== undefined) patch.periodicidade = workOrderPeriodicityLabels[data.periodicity];
    if (data.status !== undefined) patch.status = workOrderStatusLabels[data.status];
    if (data.sectorId !== undefined) patch.setor = data.sectorId;
    if (data.machineId !== undefined) {
      const { idToName } = await getMachineNameMaps(companyId);
      patch.idMaquina = idToName.get(data.machineId) ?? row.idMaquina;
    }
    if (data.executorName !== undefined) {
      patch.Executor = data.executorName;
    } else if (data.executorId !== undefined) {
      const { data: executorRow } = await supabase.from("User").select("nomeUser").eq("idRef", data.executorId).maybeSingle();
      patch.Executor = executorRow?.nomeUser ?? row.Executor;
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from(TABLE).update(patch).eq("id", Number(id));
      if (error) throw new Error(error.message);
    }

    const [{ nameToId }, userNameToId, refetch] = await Promise.all([
      getMachineNameMaps(companyId),
      getUserNameToId(companyId),
      supabase.from(TABLE).select(OS_COLUMNS).eq("id", Number(id)).single(),
    ]);
    if (refetch.error) throw new Error(refetch.error.message);
    return toWorkOrder(refetch.data as OsRow, nameToId, userNameToId);
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", Number(id));
    if (error) throw new Error(error.message);
  }
}
