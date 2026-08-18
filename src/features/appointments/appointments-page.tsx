import { useMemo, useState } from "react";
import { Plus, MoreVertical, Clock, Pencil, Eye, Trash2, ClipboardList } from "lucide-react";
import { format, parseISO } from "date-fns";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from "@/features/appointments/queries";
import { AppointmentFormDialog } from "@/features/appointments/components/appointment-form-dialog";
import type { AppointmentFormValues } from "@/domain/schemas/appointment.schema";
import type { Appointment } from "@/domain/entities/appointment";
import { repositories } from "@/data/repositories";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 8;

export function AppointmentsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [page, setPage] = useState(1);

  const formDialog = useDisclosure();
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [viewing, setViewing] = useState<Appointment | null>(null);
  const deleteDialog = useDisclosure();
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const sectorsQuery = useSectors(companyId);
  const machinesQuery = useMachines(companyId, {});
  const usersQuery = useQuery({
    queryKey: ["users", companyId],
    queryFn: () => repositories.users.listByCompany(companyId),
  });

  const filters = {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sectorId: sectorId || undefined,
    machineId: machineId || undefined,
    authorId: authorId || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const appointmentsQuery = useAppointments(companyId, filters);

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();

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

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSectorId("");
    setMachineId("");
    setAuthorId("");
    setPage(1);
  };
  const hasFilters = !!dateFrom || !!dateTo || !!sectorId || !!machineId || !!authorId;

  const openCreate = () => {
    setEditing(null);
    formDialog.open();
  };
  const openEdit = (appt: Appointment) => {
    setEditing(appt);
    formDialog.open();
  };
  const openDelete = (appt: Appointment) => {
    setToDelete(appt);
    deleteDialog.open();
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: values });
        toast({ title: "Apontamento atualizado com sucesso.", variant: "success" });
      } else {
        await createMutation.mutateAsync(values);
        toast({ title: "Apontamento criado com sucesso.", variant: "success" });
      }
      formDialog.close();
    } catch (err) {
      toast({
        title: "Nao foi possivel salvar o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast({ title: "Apontamento excluido.", variant: "success" });
      deleteDialog.close();
    } catch (err) {
      toast({
        title: "Nao foi possivel excluir o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb current="Apontamentos" />
          <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
            Apontamentos
          </h1>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            Filtrar apontamentos
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold uppercase tracking-wide text-brand-light hover:underline">
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="label-caps mb-1.5 block">Data inicio</label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Data fim</label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Setor</label>
            <SearchableSelect
              options={[{ value: "", label: "Todos os Setores" }, ...sectorOptions]}
              value={sectorId}
              onChange={(v) => { setSectorId(v); setPage(1); }}
              placeholder="Todos os Setores"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Maquina</label>
            <SearchableSelect
              options={[{ value: "", label: "Todas as Maquinas" }, ...machineOptions]}
              value={machineId}
              onChange={(v) => { setMachineId(v); setPage(1); }}
              placeholder="Todas as Maquinas"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Lancador</label>
            <SearchableSelect
              options={[{ value: "", label: "Todos os Lancadores" }, ...userOptions]}
              value={authorId}
              onChange={(v) => { setAuthorId(v); setPage(1); }}
              placeholder="Todos os Lancadores"
            />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </div>
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
            description="Ajuste os filtros ou registre um novo apontamento."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="h-4 w-4" /> Novo apontamento
              </Button>
            }
          />
        )}

        {appointmentsQuery.isSuccess && appointmentsQuery.data.items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-panel-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">Lancamento</th>
                    <th className="px-4 py-3 font-semibold">Lancador</th>
                    <th className="px-4 py-3 font-semibold">Maquina / Setor</th>
                    <th className="px-4 py-3 font-semibold">Apontamento</th>
                    <th className="px-4 py-3 font-semibold">Duracao</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {appointmentsQuery.data.items.map((appt) => (
                    <tr key={appt.id} className="border-b border-panel-border last:border-0 hover:bg-navy-800/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-200">{format(parseISO(appt.date), "dd/MM/yyyy")}</p>
                        <p className="text-xs text-muted">{appt.time}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/20 text-[11px] font-bold text-brand-light">
                            {appt.authorName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-slate-200">{appt.authorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-200">{machineById.get(appt.machineId) ?? "-"}</p>
                        <p className="text-xs text-muted">{sectorById.get(appt.sectorId) ?? "-"}</p>
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-3 text-slate-300">{appt.description}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-brand-light">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(appt.durationMinutes)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="rounded-md p-1.5 text-muted hover:bg-navy-700 hover:text-slate-200" aria-label="Mais acoes">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              className="z-50 w-44 overflow-hidden rounded-lg border border-panel-border bg-navy-800 py-1 shadow-soft"
                            >
                              <DropdownMenu.Item
                                onSelect={() => setViewing(appt)}
                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-200 outline-none hover:bg-navy-700"
                              >
                                <Eye className="h-4 w-4" /> Visualizar
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onSelect={() => openEdit(appt)}
                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-200 outline-none hover:bg-navy-700"
                              >
                                <Pencil className="h-4 w-4" /> Editar
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onSelect={() => openDelete(appt)}
                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-danger-light outline-none hover:bg-danger/10"
                              >
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={appointmentsQuery.data.page}
              pageSize={appointmentsQuery.data.pageSize}
              total={appointmentsQuery.data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <AppointmentFormDialog
        open={formDialog.isOpen}
        onOpenChange={formDialog.close}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        sectors={sectorsQuery.data ?? []}
        machines={machinesQuery.data ?? []}
        users={usersQuery.data ?? []}
        initial={editing}
      />

      <Dialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        title="Detalhes do apontamento"
        size="sm"
      >
        {viewing && (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Maquina</dt><dd className="text-slate-200">{machineById.get(viewing.machineId)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Setor</dt><dd className="text-slate-200">{sectorById.get(viewing.sectorId)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Data</dt><dd className="text-slate-200">{format(parseISO(viewing.date), "dd/MM/yyyy")} as {viewing.time}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Duracao</dt><dd className="text-slate-200">{formatDuration(viewing.durationMinutes)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Lancador</dt><dd className="text-slate-200">{viewing.authorName}</dd></div>
            <div><dt className="text-muted">Descricao</dt><dd className="mt-1 text-slate-200">{viewing.description}</dd></div>
          </dl>
        )}
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.close}
        title="Excluir apontamento"
        description={`Tem certeza que deseja excluir o apontamento "${toDelete?.description}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        confirmLabel="Excluir"
      />
    </div>
  );
}
