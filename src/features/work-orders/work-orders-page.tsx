import { useMemo, useState } from "react";
import { Plus, Search, Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import {
  useWorkOrders,
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useDeleteWorkOrder,
} from "@/features/work-orders/queries";
import { WorkOrderFormDialog } from "@/features/work-orders/components/work-order-form-dialog";
import type { WorkOrderFormValues } from "@/domain/schemas/work-order.schema";
import type { WorkOrder } from "@/domain/entities/work-order";
import { WorkOrderStatus } from "@/domain/types/enums";
import { workOrderStatusLabels } from "@/lib/labels";
import { repositories } from "@/data/repositories";
import { useQuery } from "@tanstack/react-query";

const statusOptions = Object.entries(workOrderStatusLabels).map(([value, label]) => ({ value, label }));

const statusTone: Record<WorkOrderStatus, "success" | "warning" | "danger" | "brand" | "neutral"> = {
  [WorkOrderStatus.LANCADA]: "brand",
  [WorkOrderStatus.EM_ANDAMENTO]: "warning",
  [WorkOrderStatus.CONCLUIDA]: "success",
  [WorkOrderStatus.ATRASADA]: "danger",
  [WorkOrderStatus.CANCELADA]: "neutral",
};

export function WorkOrdersPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const formDialog = useDisclosure();
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [detail, setDetail] = useState<WorkOrder | null>(null);
  const deleteDialog = useDisclosure();
  const [toDelete, setToDelete] = useState<WorkOrder | null>(null);

  const sectorsQuery = useSectors(companyId);
  const machinesQuery = useMachines(companyId, {});
  const usersQuery = useQuery({
    queryKey: ["users", companyId],
    queryFn: () => repositories.users.listByCompany(companyId),
  });

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    status: (status as WorkOrderStatus) || undefined,
    sectorId: sectorId || undefined,
    machineId: machineId || undefined,
    search: debouncedSearch || undefined,
  };
  const ordersQuery = useWorkOrders(companyId, filters);

  const createMutation = useCreateWorkOrder();
  const updateMutation = useUpdateWorkOrder();
  const deleteMutation = useDeleteWorkOrder();

  const sectorOptions = useMemo(() => (sectorsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })), [sectorsQuery.data]);
  const machineOptions = useMemo(() => (machinesQuery.data ?? []).map((m) => ({ value: m.id, label: m.name })), [machinesQuery.data]);
  const machineById = useMemo(() => {
    const map = new Map<string, string>();
    (machinesQuery.data ?? []).forEach((m) => map.set(m.id, m.name));
    return map;
  }, [machinesQuery.data]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setSectorId("");
    setMachineId("");
    setSearch("");
  };
  const hasFilters = !!dateFrom || !!dateTo || !!status || !!sectorId || !!machineId || !!search;

  const openCreate = () => {
    setEditing(null);
    formDialog.open();
  };
  const openEdit = (order: WorkOrder) => {
    setEditing(order);
    formDialog.open();
  };

  const handleSubmit = async (values: WorkOrderFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: values });
        toast({ title: "Ordem de servico atualizada.", variant: "success" });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: "Ordem de servico criada.", variant: "success" });
      }
      formDialog.close();
    } catch (err) {
      toast({
        title: "Nao foi possivel salvar a O.S.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast({ title: "Ordem de servico excluida.", variant: "success" });
      deleteDialog.close();
    } catch (err) {
      toast({
        title: "Nao foi possivel excluir a O.S.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb current="Ordem de Servico" />
        <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          Ordem de Servico
        </h1>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Filtrar ordens de servico</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold uppercase tracking-wide text-brand-light hover:underline">
              Limpar todos
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="label-caps mb-1.5 block">Inicio</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Fim</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Status</label>
            <SearchableSelect
              options={[{ value: "", label: "Todos" }, ...statusOptions]}
              value={status}
              onChange={setStatus}
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Setor</label>
            <SearchableSelect
              options={[{ value: "", label: "Todos" }, ...sectorOptions]}
              value={sectorId}
              onChange={setSectorId}
              placeholder="Todos"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Maquina</label>
            <SearchableSelect
              options={[{ value: "", label: "Todas" }, ...machineOptions]}
              value={machineId}
              onChange={setMachineId}
              placeholder="Todas"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Busca</label>
            <Input
              placeholder="N. ou nome..."
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova O.S.
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {ordersQuery.isLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {ordersQuery.isError && (
          <ErrorState
            message={(ordersQuery.error as Error)?.message ?? "Erro desconhecido."}
            onRetry={() => ordersQuery.refetch()}
          />
        )}

        {ordersQuery.isSuccess && ordersQuery.data.length === 0 && (
          <EmptyState
            icon={<Wrench className="h-10 w-10" />}
            title="Nenhuma ordem de servico encontrada"
            description="Ajuste os filtros ou crie uma nova O.S."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="h-4 w-4" /> Nova O.S.
              </Button>
            }
          />
        )}

        {ordersQuery.isSuccess && ordersQuery.data.length > 0 && (
          <div className="divide-y divide-panel-border">
            {ordersQuery.data.map((order) => (
              <div
                key={order.id}
                className={`flex flex-col gap-3 border-l-4 p-4 sm:flex-row sm:items-center sm:justify-between ${
                  order.status === WorkOrderStatus.CONCLUIDA
                    ? "border-l-success"
                    : order.status === WorkOrderStatus.ATRASADA
                      ? "border-l-danger"
                      : order.status === WorkOrderStatus.EM_ANDAMENTO
                        ? "border-l-warning"
                        : "border-l-brand"
                }`}
              >
                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
                  <div>
                    <p className="label-caps">Numero O.S.</p>
                    <p className="text-sm font-semibold text-slate-200">{order.number}</p>
                  </div>
                  <div>
                    <p className="label-caps">Data</p>
                    <p className="text-sm text-slate-300">{format(parseISO(order.date), "yyyy-MM-dd")}</p>
                  </div>
                  <div>
                    <p className="label-caps">Maquina</p>
                    <p className="text-sm text-slate-300">{machineById.get(order.machineId) ?? "-"}</p>
                  </div>
                  <div>
                    <p className="label-caps">Executor</p>
                    <p className="text-sm text-slate-300">{order.executorName}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="label-caps">Servico</p>
                    <p className="truncate text-sm text-slate-300">{order.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Badge tone={statusTone[order.status]}>{workOrderStatusLabels[order.status]}</Badge>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setDetail(order)}>
                      Detalhes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(order)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger-light hover:bg-danger/10"
                      onClick={() => {
                        setToDelete(order);
                        deleteDialog.open();
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <WorkOrderFormDialog
        open={formDialog.isOpen}
        onOpenChange={formDialog.close}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        sectors={sectorsQuery.data ?? []}
        machines={machinesQuery.data ?? []}
        users={usersQuery.data ?? []}
        initial={editing}
      />

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title="Detalhes da O.S." size="sm">
        {detail && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Numero</dt><dd className="text-slate-200">{detail.number}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Maquina</dt><dd className="text-slate-200">{machineById.get(detail.machineId)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Executor</dt><dd className="text-slate-200">{detail.executorName}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Data</dt><dd className="text-slate-200">{format(parseISO(detail.date), "dd/MM/yyyy")}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Status</dt><dd><Badge tone={statusTone[detail.status]}>{workOrderStatusLabels[detail.status]}</Badge></dd></div>
            <div><dt className="text-muted">Servico</dt><dd className="mt-1 text-slate-200">{detail.description}</dd></div>
          </dl>
        )}
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.close}
        title="Excluir ordem de servico"
        description={`Tem certeza que deseja excluir a O.S. ${toDelete?.number}? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        confirmLabel="Excluir"
      />
    </div>
  );
}
