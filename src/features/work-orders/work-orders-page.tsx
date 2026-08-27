import { useMemo, useRef, useState } from "react";
import { Plus, Search, Wrench, Filter, Calendar } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FilterField } from "@/components/ui/filter-field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useAuth } from "@/features/auth/auth-context";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import { useWorkOrders, useCreateWorkOrder, useUpdateWorkOrder } from "@/features/work-orders/queries";
import { WorkOrderFormDialog } from "@/features/work-orders/components/work-order-form-dialog";
import { WorkOrderDetailsDialog, WorkOrderStatusBadge } from "@/features/work-orders/components/work-order-details-dialog";
import { WorkOrderQuickEditDialog } from "@/features/work-orders/components/work-order-quick-edit-dialog";
import { toast } from "@/hooks/use-toast";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { WorkOrderFormValues, WorkOrderQuickEditValues } from "@/domain/schemas/work-order.schema";
import type { WorkOrder } from "@/domain/entities/work-order";
import { WorkOrderStatus } from "@/domain/types/enums";
import { workOrderStatusLabels } from "@/lib/labels";
import { repositories } from "@/data/repositories";
import { useQuery } from "@tanstack/react-query";

const statusOptions = Object.entries(workOrderStatusLabels).map(([value, label]) => ({ value, label }));

const statusBorder: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.LANCADA]: "border-l-brand",
  [WorkOrderStatus.ATRASADA]: "border-l-danger",
  [WorkOrderStatus.CONCLUIDA]: "border-l-success",
  [WorkOrderStatus.REALIZADA]: "border-l-success",
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
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<WorkOrder | null>(null);
  const [editing, setEditing] = useState<WorkOrder | null>(null);

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

  const sectorOptions = useMemo(() => (sectorsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })), [sectorsQuery.data]);
  const machineOptions = useMemo(() => (machinesQuery.data ?? []).map((m) => ({ value: m.id, label: m.name })), [machinesQuery.data]);
  const machineById = useMemo(() => {
    const map = new Map<string, string>();
    (machinesQuery.data ?? []).forEach((m) => map.set(m.id, m.name));
    return map;
  }, [machinesQuery.data]);
  const sectorById = useMemo(() => {
    const map = new Map<string, string>();
    (sectorsQuery.data ?? []).forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sectorsQuery.data]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatus("");
    setSectorId("");
    setMachineId("");
    setSearch("");
  };

  const handleCreate = async (values: WorkOrderFormValues) => {
    try {
      await createMutation.mutateAsync({ ...values, status: WorkOrderStatus.LANCADA });
      toast({ title: "Ordem de serviço criada.", variant: "success" });
      setFormOpen(false);
    } catch (err) {
      toast({
        title: "Não foi possível salvar a O.S.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const handleQuickEdit = async (values: WorkOrderQuickEditValues) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, data: values });
      toast({ title: "Ordem de serviço atualizada.", variant: "success" });
      setEditing(null);
    } catch (err) {
      toast({
        title: "Não foi possível salvar a O.S.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb current="Ordem de Serviço" />
        <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">Ordem de Serviço</h1>
      </div>

      <Card className="p-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white">
            <Filter className="h-4 w-4 text-brand-light" /> Filtrar ordens de serviço
          </p>
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
          >
            Limpar todos
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <FilterField label="Início">
            <Input
              ref={dateFromRef}
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              onIconClick={() => dateFromRef.current?.showPicker?.()}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
          <FilterField label="Fim">
            <Input
              ref={dateToRef}
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              onIconClick={() => dateToRef.current?.showPicker?.()}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
          <FilterField label="Status">
            <SearchableSelect
              options={[{ value: "", label: "Todos" }, ...statusOptions]}
              value={status}
              onChange={setStatus}
              placeholder="Todos"
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
          <FilterField label="Setor">
            <SearchableSelect
              options={[{ value: "", label: "Todos" }, ...sectorOptions]}
              value={sectorId}
              onChange={setSectorId}
              placeholder="Todos"
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
          <FilterField label="Máquina">
            <SearchableSelect
              options={[{ value: "", label: "Todas" }, ...machineOptions]}
              value={machineId}
              onChange={setMachineId}
              placeholder="Todas"
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
          <FilterField label="Busca">
            <Input
              placeholder="N. ou nome..."
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-6">
          <Button onClick={() => setFormOpen(true)} className="h-11">
            <Plus className="h-4 w-4" /> Nova O.S.
          </Button>
        </div>
      </Card>

      {ordersQuery.isLoading && (
        <Card className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </Card>
      )}

      {ordersQuery.isError && (
        <Card>
          <ErrorState
            message={(ordersQuery.error as Error)?.message ?? "Erro desconhecido."}
            onRetry={() => ordersQuery.refetch()}
          />
        </Card>
      )}

      {ordersQuery.isSuccess && ordersQuery.data.length === 0 && (
        <Card>
          <EmptyState
            icon={<Wrench className="h-10 w-10" />}
            title="Nenhuma ordem de serviço encontrada"
            description="Ajuste os filtros ou crie uma nova O.S."
            action={
              <Button onClick={() => setFormOpen(true)} size="sm">
                <Plus className="h-4 w-4" /> Nova O.S.
              </Button>
            }
          />
        </Card>
      )}

      {ordersQuery.isSuccess && ordersQuery.data.length > 0 && (
        <div className="grid gap-6">
          {ordersQuery.data.map((order) => (
            <div
              key={order.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-white/10 border-l-4 ${statusBorder[order.status]}`}
            >
              <div className="grid items-center gap-4 md:grid-cols-[170px_110px_150px_200px_minmax(180px,1fr)_130px_110px]">
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="label-caps">Número O.S.</p>
                  <p className="text-sm font-bold text-white">#{order.number.replace(/^#/, "")}</p>
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="label-caps">Data</p>
                  <p className="text-sm font-bold text-white">{order.date}</p>
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="label-caps">Máquina</p>
                  <p className="truncate text-sm font-bold text-white">{machineById.get(order.machineId) ?? "-"}</p>
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="label-caps">Executor</p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[8px] font-bold text-white">
                      {order.executorName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate text-sm font-bold text-white">{order.executorName}</span>
                  </div>
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <p className="label-caps">Serviço</p>
                  <p className="line-clamp-1 text-sm text-muted transition-colors group-hover:text-white">{order.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="label-caps">Status</p>
                  <WorkOrderStatusBadge status={order.status} />
                </div>
                <div className="flex sm:justify-end">
                  <button
                    onClick={() => setViewing(order)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95"
                  >
                    Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkOrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        companyId={companyId}
        sectors={sectorsQuery.data ?? []}
        machines={machinesQuery.data ?? []}
        users={usersQuery.data ?? []}
      />

      <WorkOrderDetailsDialog
        order={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
        machineName={viewing ? machineById.get(viewing.machineId) : undefined}
        sectorName={viewing ? sectorById.get(viewing.sectorId) : undefined}
      />

      <WorkOrderQuickEditDialog
        order={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={handleQuickEdit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
