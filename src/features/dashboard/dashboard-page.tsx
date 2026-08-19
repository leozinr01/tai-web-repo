import { useMemo, useState } from "react";
import { Filter, Gauge, Thermometer, LayoutGrid, Cog } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { IndicatorCard } from "@/features/dashboard/components/indicator-card";
import { MachineCard } from "@/features/dashboard/components/machine-card";
import { useAuth } from "@/features/auth/auth-context";
import { useDashboardIndicators, useMachines, useSectors } from "@/features/dashboard/queries";
import { MachineStatus } from "@/domain/types/enums";
import { machineStatusLabels } from "@/lib/labels";

const statusOptions = Object.entries(machineStatusLabels).map(([value, label]) => ({ value, label }));

export function DashboardPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const [sectorId, setSectorId] = useState<string>("");
  const [machineId, setMachineId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [highVibration, setHighVibration] = useState(false);
  const [highTemperature, setHighTemperature] = useState(false);

  const indicatorsQuery = useDashboardIndicators(companyId);
  const sectorsQuery = useSectors(companyId);
  const allMachinesQuery = useMachines(companyId, {});
  const machinesQuery = useMachines(companyId, {
    sectorId: sectorId || undefined,
    machineId: machineId || undefined,
    status: (status as MachineStatus) || undefined,
    highVibration,
    highTemperature,
  });

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

  const clearFilters = () => {
    setSectorId("");
    setMachineId("");
    setStatus("");
    setHighVibration(false);
    setHighTemperature(false);
  };

  const hasFilters = !!sectorId || !!machineId || !!status || highVibration || highTemperature;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb current="Dashboard" />
        <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <IndicatorCard
          label="Indicador OEE"
          value={indicatorsQuery.data?.oee}
          history={indicatorsQuery.data?.oeeHistory}
          color="#21c1b3"
          isLoading={indicatorsQuery.isLoading}
        />
        <IndicatorCard
          label="Disponibilidade"
          value={indicatorsQuery.data?.availability}
          history={indicatorsQuery.data?.availabilityHistory}
          color="#3b4fe6"
          isLoading={indicatorsQuery.isLoading}
        />
        <IndicatorCard
          label="Produtividade"
          value={indicatorsQuery.data?.productivity}
          history={indicatorsQuery.data?.productivityHistory}
          color="#1bb58f"
          isLoading={indicatorsQuery.isLoading}
        />
        <IndicatorCard
          label="Qualidade"
          value={indicatorsQuery.data?.quality}
          history={indicatorsQuery.data?.qualityHistory}
          color="#2f6de2"
          isLoading={indicatorsQuery.isLoading}
        />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            <Filter className="h-4 w-4 text-brand-light" />
            Filtros de operacao
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold uppercase tracking-wide text-brand-light hover:underline"
            >
              Limpar todos
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label-caps mb-1.5 block">Setor</label>
            <SearchableSelect
              options={[{ value: "", label: "Todos os Setores" }, ...sectorOptions]}
              value={sectorId}
              onChange={setSectorId}
              placeholder="Todos os Setores"
              icon={<LayoutGrid className="h-4 w-4" />}
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Maquina</label>
            <SearchableSelect
              options={[{ value: "", label: "Todas as Maquinas" }, ...machineOptions]}
              value={machineId}
              onChange={setMachineId}
              placeholder="Todas as Maquinas"
              icon={<Cog className="h-4 w-4" />}
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Status</label>
            <SearchableSelect
              options={[{ value: "", label: "Todos os Status" }, ...statusOptions]}
              value={status}
              onChange={setStatus}
              placeholder="Todos os Status"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Vibracao alta</label>
            <div className="flex h-10 items-center gap-2">
              <Switch checked={highVibration} onCheckedChange={setHighVibration} aria-label="Vibracao alta" />
              <Gauge className="h-4 w-4 text-muted" />
            </div>
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Temp. alta</label>
            <div className="flex h-10 items-center gap-2">
              <Switch checked={highTemperature} onCheckedChange={setHighTemperature} aria-label="Temp. alta" />
              <Thermometer className="h-4 w-4 text-muted" />
            </div>
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

      {machinesQuery.isError && (
        <ErrorState
          message={(machinesQuery.error as Error)?.message ?? "Erro desconhecido."}
          onRetry={() => machinesQuery.refetch()}
        />
      )}

      {machinesQuery.isSuccess && machinesQuery.data.length === 0 && (
        <EmptyState
          title="Nenhuma maquina encontrada"
          description="Ajuste os filtros de operacao para ver os cards de maquinas."
        />
      )}

      {machinesQuery.isSuccess && machinesQuery.data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {machinesQuery.data.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              sectorName={sectorNameById.get(machine.sectorId)}
              sectors={sectorsQuery.data ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
