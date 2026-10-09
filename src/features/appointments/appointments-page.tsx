import { useMemo, useRef, useState } from "react";
import { Plus, Clock, MoreVertical, ClipboardList, Filter, Calendar, Factory, Zap, User as UserIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FilterField } from "@/components/ui/filter-field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { useClientPagination } from "@/hooks/use-client-pagination";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useAuth } from "@/features/auth/use-auth";
import { canWriteRecords } from "@/domain/permissions";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import { useAppointments, useCreateAppointment, useUpdateAppointment } from "@/features/appointments/queries";
import { AppointmentFormDialog } from "@/features/appointments/components/appointment-form-dialog";
import { AppointmentDetailsDialog } from "@/features/appointments/components/appointment-details-dialog";
import { AppointmentQuickEditDialog } from "@/features/appointments/components/appointment-quick-edit-dialog";
import { toast } from "@/hooks/use-toast";
import { toCsv, downloadCsv } from "@/lib/csv";
import { formatDuration } from "@/domain/appointment-time";
import type { AppointmentFormValues } from "@/domain/schemas/appointment.schema";
import type { Appointment } from "@/domain/entities/appointment";
import { UserRole } from "@/domain/types/enums";
import { repositories } from "@/data/repositories";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/use-page-title";

// A consulta traz a lista filtrada inteira (a exportacao usa tudo); a tabela mostra uma pagina por vez.
const ALL_ITEMS_PAGE_SIZE = 100000;
const PAGE_SIZE = 50;
const FILTER_KEYS = ["de", "ate", "setor", "maquina", "lancador"] as const;

export function AppointmentsPage() {
  usePageTitle("Apontamentos");
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";
  const canWrite = canWriteRecords(user?.role);
  // Master enxerga todas as empresas na lista e nos filtros; o formulario de criacao continua na propria empresa.
  const scopeCompanyId = user?.role === UserRole.MASTER ? undefined : companyId;

  const { values: urlFilters, setFilter, clearFilters } = useUrlFilters(FILTER_KEYS);
  const { de: dateFrom, ate: dateTo, setor: sectorId, maquina: machineId, lancador: authorId } = urlFilters;
  const setDateFrom = (value: string) => setFilter("de", value);
  const setDateTo = (value: string) => setFilter("ate", value);
  const setSectorId = (value: string) => setFilter("setor", value);
  const setMachineId = (value: string) => setFilter("maquina", value);
  const setAuthorId = (value: string) => setFilter("lancador", value);
  const dateFromRef = useRef<HTMLInputElement>(null);
  const dateToRef = useRef<HTMLInputElement>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const sectorsQuery = useSectors(scopeCompanyId);
  const machinesQuery = useMachines(scopeCompanyId, {});
  const usersQuery = useQuery({
    queryKey: ["users", scopeCompanyId],
    queryFn: () => repositories.users.listByCompany(scopeCompanyId),
  });
  const ownSectorsQuery = useSectors(companyId);
  const ownMachinesQuery = useMachines(companyId, {});
  const ownUsersQuery = useQuery({
    queryKey: ["users", companyId],
    queryFn: () => repositories.users.listByCompany(companyId),
  });

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sectorId: sectorId || undefined,
    machineId: machineId || undefined,
    authorId: authorId || undefined,
    page: 1,
    pageSize: ALL_ITEMS_PAGE_SIZE,
  };
  const appointmentsQuery = useAppointments(scopeCompanyId, filters);
  const { page, pageItems, setPage } = useClientPagination(
    appointmentsQuery.data?.items ?? [],
    PAGE_SIZE,
    JSON.stringify(filters),
  );

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const sectorOptions = useMemo(
    () => (sectorsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sectorsQuery.data],
  );
  const machineOptions = useMemo(
    () => (machinesQuery.data ?? []).map((m) => ({ value: m.id, label: m.name })),
    [machinesQuery.data],
  );
  const userOptions = useMemo(
    () => (usersQuery.data ?? []).map((u) => ({ value: u.id, label: u.name })),
    [usersQuery.data],
  );
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

  const handleCreate = async (values: AppointmentFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      toast({ title: "Apontamento criado com sucesso.", variant: "success" });
      setFormOpen(false);
    } catch (err) {
      toast({
        title: "Não foi possível salvar o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const handleQuickEdit = async (data: { durationMinutes: number; description: string }) => {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ id: editing.id, data });
      toast({ title: "Apontamento atualizado com sucesso.", variant: "success" });
      setEditing(null);
    } catch (err) {
      toast({
        title: "Não foi possível salvar o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const handleToggleCompleted = async () => {
    if (!viewing) return;
    const completedAt = viewing.completedAt ? null : new Date().toISOString();
    try {
      const updated = await updateMutation.mutateAsync({ id: viewing.id, data: { completedAt } });
      toast({
        title: completedAt ? "Apontamento marcado como concluído." : "Apontamento reaberto.",
        variant: "success",
      });
      setViewing(updated);
    } catch (err) {
      toast({
        title: "Não foi possível atualizar o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  // Exporta o que esta filtrado na tela (a lista ja vem inteira, sem paginacao no banco).
  const handleExport = () => {
    const items = appointmentsQuery.data?.items ?? [];
    if (items.length === 0) {
      toast({ title: "Não há dados para exportar.", variant: "warning" });
      return;
    }
    const rows = items.map((a) => ({
      date: formatDate(a.date),
      time: a.time,
      sector: sectorById.get(a.sectorId) ?? a.sectorId,
      machine: machineById.get(a.machineId) ?? "-",
      area: a.area,
      segment: a.affectedSegment,
      duration: formatDuration(a.durationMinutes),
      durationMinutes: a.durationMinutes,
      author: a.authorName,
      description: a.description,
      status: a.completedAt ? "Concluído" : "Em aberto",
    }));
    const csv = toCsv(rows, [
      { key: "date", label: "Data" },
      { key: "time", label: "Hora" },
      { key: "sector", label: "Setor" },
      { key: "machine", label: "Máquina" },
      { key: "area", label: "Área" },
      { key: "segment", label: "Seguimento afetado" },
      { key: "duration", label: "Tempo parado (hh:mm)" },
      { key: "durationMinutes", label: "Tempo parado (min)" },
      { key: "author", label: "Lançador" },
      { key: "description", label: "Apontamento" },
      { key: "status", label: "Status" },
    ]);
    downloadCsv(`apontamentos-tai-project-${format(new Date(), "yyyyMMdd-HHmm")}.csv`, csv);
    toast({ title: `${items.length} apontamentos exportados.`, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb current="Apontamentos" />
          <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">Apontamentos</h1>
        </div>
        <Button onClick={handleExport} className="gap-2 rounded-xl border-0 bg-white/5 text-sm font-bold text-white shadow-none hover:bg-white/10">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 p-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white">
            <Filter className="h-4 w-4 text-brand-light" /> Filtrar apontamentos
          </p>
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
          >
            Limpar filtros
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterField label="Data início">
            <Input
              ref={dateFromRef}
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              onIconClick={() => dateFromRef.current?.showPicker?.()}
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 border-white/20 bg-white/10 text-xs font-bold"
            />
          </FilterField>
          <FilterField label="Data fim">
            <Input
              ref={dateToRef}
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              onIconClick={() => dateToRef.current?.showPicker?.()}
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 border-white/20 bg-white/10 text-xs font-bold"
            />
          </FilterField>
          <FilterField label="Setor">
            <SearchableSelect
              icon={<Factory className="h-4 w-4" />}
              options={[{ value: "", label: "Todos os Setores" }, ...sectorOptions]}
              value={sectorId}
              onChange={setSectorId}
              placeholder="Todos os Setores"
              className="h-9 border-white/20 bg-white/10 text-xs font-bold"
            />
          </FilterField>
          <FilterField label="Máquina">
            <SearchableSelect
              icon={<Zap className="h-4 w-4" />}
              options={[{ value: "", label: "Todas as Máquinas" }, ...machineOptions]}
              value={machineId}
              onChange={setMachineId}
              placeholder="Todas as Máquinas"
              className="h-9 border-white/20 bg-white/10 text-xs font-bold"
            />
          </FilterField>
          <FilterField label="Lançador">
            <SearchableSelect
              icon={<UserIcon className="h-4 w-4" />}
              options={[{ value: "", label: "Todos os Lançadores" }, ...userOptions]}
              value={authorId}
              onChange={setAuthorId}
              placeholder="Todos os Lançadores"
              className="h-9 border-white/20 bg-white/10 text-xs font-bold"
            />
          </FilterField>
          {canWrite && (
            <div className="flex items-end">
              <Button onClick={() => setFormOpen(true)} className="h-9 w-full">
                <Plus className="h-4 w-4" /> Novo
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {appointmentsQuery.isLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {appointmentsQuery.isError && (
          <ErrorState
            message={(appointmentsQuery.error as Error)?.message ?? "Erro desconhecido."}
            onRetry={() => appointmentsQuery.refetch()}
          />
        )}

        {appointmentsQuery.isSuccess && appointmentsQuery.data.items.length === 0 && (
          <EmptyState
            icon={<ClipboardList className="h-10 w-10" />}
            title="Nenhum apontamento encontrado"
            description={canWrite ? "Ajuste os filtros ou registre um novo apontamento." : "Ajuste os filtros."}
            action={
              canWrite && (
                <Button onClick={() => setFormOpen(true)} size="sm">
                  <Plus className="h-4 w-4" /> Novo apontamento
                </Button>
              )
            }
          />
        )}

        {appointmentsQuery.isSuccess && appointmentsQuery.data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-panel-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Lançamento</th>
                  <th className="px-4 py-3 font-semibold">Lançador</th>
                  <th className="px-4 py-3 font-semibold">Máquina / Setor</th>
                  <th className="px-4 py-3 font-semibold">Apontamento</th>
                  <th className="px-4 py-3 font-semibold">Duração</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageItems.map((appt) => (
                  <tr key={appt.id} className="group border-b border-panel-border last:border-0 hover:bg-navy-800/50">
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-white">{formatDate(appt.date)}</p>
                      <p className="text-xs text-muted">{appt.time}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 text-xs font-bold text-brand">
                          {appt.authorName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white">{appt.authorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-white">{machineById.get(appt.machineId) ?? "-"}</p>
                      <p className="text-xs text-muted">{sectorById.get(appt.sectorId) ?? (appt.sectorId || "-")}</p>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-xs text-muted transition-colors group-hover:text-white">
                      {appt.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs font-bold text-white">
                        <Clock className="h-3.5 w-3.5 text-brand" />
                        {formatDuration(appt.durationMinutes)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge tone={appt.completedAt ? "success" : "warning"}>
                        {appt.completedAt ? "Concluído" : "Em aberto"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setViewing(appt)}
                        className="rounded-md p-1.5 text-muted hover:bg-navy-700 hover:text-slate-200"
                        aria-label="Ver detalhes do apontamento"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {appointmentsQuery.isSuccess && appointmentsQuery.data.items.length > 0 && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={appointmentsQuery.data.items.length}
            onPageChange={setPage}
          />
        )}
      </Card>

      <AppointmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isSubmitting={createMutation.isPending}
        companyId={companyId}
        sectors={ownSectorsQuery.data ?? []}
        machines={ownMachinesQuery.data ?? []}
        users={ownUsersQuery.data ?? []}
        initial={null}
      />

      <AppointmentDetailsDialog
        appointment={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onEdit={
          canWrite
            ? () => {
                setEditing(viewing);
                setViewing(null);
              }
            : undefined
        }
        onToggleCompleted={canWrite ? handleToggleCompleted : undefined}
        isTogglingCompleted={updateMutation.isPending}
        machineName={viewing ? machineById.get(viewing.machineId) : undefined}
        sectorName={viewing ? sectorById.get(viewing.sectorId) : undefined}
      />

      <AppointmentQuickEditDialog
        appointment={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={handleQuickEdit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
