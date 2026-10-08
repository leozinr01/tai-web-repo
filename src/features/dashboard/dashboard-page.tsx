import { useMemo } from "react";
import { Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { IndicatorCard } from "@/features/dashboard/components/indicator-card";
import { MachineCard } from "@/features/dashboard/components/machine-card";
import { DefaultCardSettingsDialog } from "@/features/dashboard/components/default-card-settings-dialog";
import { useAuth } from "@/features/auth/use-auth";
import { canManageCompany } from "@/domain/permissions";
import {
  DASHBOARD_REFRESH_MS,
  useDashboardIndicators,
  useMachines,
  useSectors,
  useUpdateAllMachinesCardSettings,
} from "@/features/dashboard/queries";
import { useDisclosure } from "@/hooks/use-disclosure";
import { toast } from "@/hooks/use-toast";
import { MachineStatus, UserRole } from "@/domain/types/enums";
import type { MachineCardSettings } from "@/domain/entities/machine";
import { machineStatusLabels } from "@/lib/labels";
import { usePageTitle } from "@/hooks/use-page-title";

const statusOptions = Object.entries(machineStatusLabels).map(([value, label]) => ({ value, label }));
const FILTER_KEYS = ["setor", "maquina", "status"] as const;

export function DashboardPage() {
  usePageTitle("Dashboard");
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";
  const isMaster = user?.role === UserRole.MASTER;
  const canManage = canManageCompany(user?.role);
  // Master enxerga todas as empresas (sem filtro de idRef); demais papeis ficam presos a propria empresa.
  const scopeCompanyId = isMaster ? undefined : companyId;

  const { values: urlFilters, setFilter, clearFilters } = useUrlFilters(FILTER_KEYS);
  const { setor: sectorId, maquina: machineId, status } = urlFilters;
  const setSectorId = (value: string) => setFilter("setor", value);
  const setMachineId = (value: string) => setFilter("maquina", value);
  const setStatus = (value: string) => setFilter("status", value);
  const defaultSettingsDialog = useDisclosure();
  const updateAllCardSettingsMutation = useUpdateAllMachinesCardSettings();

  const indicatorsQuery = useDashboardIndicators(companyId);
  const sectorsQuery = useSectors(scopeCompanyId);
  const allMachinesQuery = useMachines(scopeCompanyId, {});
  const machinesQuery = useMachines(
    scopeCompanyId,
    {
      sectorId: sectorId || undefined,
      machineId: machineId || undefined,
      status: (status as MachineStatus) || undefined,
    },
    { refetchInterval: DASHBOARD_REFRESH_MS },
  );

  const sectorOptions = useMemo(
    () => (sectorsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })),
    [sectorsQuery.data],
  );
  const machineOptions = useMemo(
    () => (allMachinesQuery.data ?? []).map((m) => ({ value: m.id, label: m.name })),
    [allMachinesQuery.data],
  );
  const sectorNameById = useMemo(() => {
    const map = new Map<string, string>();
    (sectorsQuery.data ?? []).forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sectorsQuery.data]);

  const hasFilters = !!sectorId || !!machineId || !!status;

  // Com a atualizacao automatica falhando, os cards continuam na tela com o ultimo dado bom e o aviso de horario.
  const machines = machinesQuery.data;
  const isStale = (machinesQuery.isError || indicatorsQuery.isError) && machinesQuery.dataUpdatedAt > 0;
  const lastUpdate = machinesQuery.dataUpdatedAt > 0 ? format(machinesQuery.dataUpdatedAt, "HH:mm:ss") : null;

  const handleSaveDefaultCardSettings = async (cardSettings: MachineCardSettings) => {
    try {
      await updateAllCardSettingsMutation.mutateAsync({ companyId, cardSettings });
      toast({ title: "Variáveis padrão aplicadas a todos os cards.", variant: "success" });
      defaultSettingsDialog.close();
    } catch (err) {
      toast({
        title: "Não foi possível atualizar os cards.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb current="Dashboard" />
        <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          Dashboard
        </h1>
        {lastUpdate && (
          <p
            role="status"
            className={cn("mt-1 flex items-center gap-1.5 text-xs", isStale ? "font-semibold text-warning-light" : "text-muted")}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", isStale ? "bg-warning" : "bg-success")} />
            {isStale ? `Sem atualização — exibindo dados das ${lastUpdate}` : `Atualizado às ${lastUpdate}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <IndicatorCard
          label="Indicador OEE"
          value={indicatorsQuery.data?.oee}
          history={indicatorsQuery.data?.oeeHistory}
          color="#21c1b3"
          fillColor="#000000"
          isLoading={indicatorsQuery.isLoading}
          isError={indicatorsQuery.isError}
        />
        <IndicatorCard
          label="Disponibilidade"
          value={indicatorsQuery.data?.availability}
          history={indicatorsQuery.data?.availabilityHistory}
          color="#3b4fe6"
          isLoading={indicatorsQuery.isLoading}
          isError={indicatorsQuery.isError}
        />
        <IndicatorCard
          label="Produtividade"
          value={indicatorsQuery.data?.productivity}
          history={indicatorsQuery.data?.productivityHistory}
          color="#1bb58f"
          isLoading={indicatorsQuery.isLoading}
          isError={indicatorsQuery.isError}
        />
        <IndicatorCard
          label="Qualidade"
          value={indicatorsQuery.data?.quality}
          history={indicatorsQuery.data?.qualityHistory}
          color="#2f6de2"
          isLoading={indicatorsQuery.isLoading}
          isError={indicatorsQuery.isError}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-200">
            <Filter className="h-4 w-4 text-brand-light" />
            Filtros de operação
          </p>
          <div className="flex items-center gap-3">
            {canManage && (
              <button
                onClick={defaultSettingsDialog.open}
                className="text-[11px] font-semibold uppercase tracking-wide text-brand hover:underline"
              >
                Cards (todos)
              </button>
            )}
            <button
              onClick={clearFilters}
              disabled={!hasFilters}
              className="text-[11px] font-semibold uppercase tracking-wide text-slate-300 hover:text-white hover:underline disabled:cursor-default disabled:text-muted disabled:hover:no-underline"
            >
              Limpar todos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="dashboard-filtro-setor" className="label-caps mb-1.5 block">Setor</label>
            <SearchableSelect
              id="dashboard-filtro-setor"
              options={[{ value: "", label: "Todos os Setores" }, ...sectorOptions]}
              value={sectorId}
              onChange={setSectorId}
              placeholder="Todos os Setores"
              className="font-bold"
            />
          </div>
          <div>
            <label htmlFor="dashboard-filtro-maquina" className="label-caps mb-1.5 block">Máquina</label>
            <SearchableSelect
              id="dashboard-filtro-maquina"
              options={[{ value: "", label: "Todas as Máquinas" }, ...machineOptions]}
              value={machineId}
              onChange={setMachineId}
              placeholder="Todas as Máquinas"
              className="font-bold"
            />
          </div>
          <div>
            <label htmlFor="dashboard-filtro-status" className="label-caps mb-1.5 block">Status</label>
            <SearchableSelect
              id="dashboard-filtro-status"
              options={[{ value: "", label: "Todos os Status" }, ...statusOptions]}
              value={status}
              onChange={setStatus}
              placeholder="Todos os Status"
              className="font-bold"
            />
          </div>
        </div>
      </Card>

      {machinesQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-3 h-5 w-32" />
              <Skeleton className="h-40 w-full" />
            </Card>
          ))}
        </div>
      )}

      {machinesQuery.isError && !machines && (
        <ErrorState
          message={(machinesQuery.error as Error)?.message ?? "Erro desconhecido."}
          onRetry={() => machinesQuery.refetch()}
        />
      )}

      {machines && machines.length === 0 && (
        <EmptyState
          title="Nenhuma máquina encontrada"
          description="Ajuste os filtros de operação para ver os cards de máquinas."
        />
      )}

      {machines && machines.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {machines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              sectorName={sectorNameById.get(machine.sectorId)}
              sectors={sectorsQuery.data ?? []}
              updatedAt={machinesQuery.dataUpdatedAt}
            />
          ))}
        </div>
      )}

      <DefaultCardSettingsDialog
        open={defaultSettingsDialog.isOpen}
        onOpenChange={defaultSettingsDialog.close}
        onSubmit={handleSaveDefaultCardSettings}
        isSubmitting={updateAllCardSettingsMutation.isPending}
      />
    </div>
  );
}
