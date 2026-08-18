import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart3 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/auth-context";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import { repositories } from "@/data/repositories";
import { toCsv, downloadCsv } from "@/lib/csv";
import { toast } from "@/hooks/use-toast";
import type { ReportRow } from "@/domain/entities/report";

export function ReportsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [machineId, setMachineId] = useState("");

  const sectorsQuery = useSectors(companyId);
  const machinesQuery = useMachines(companyId, {});

  const filters = { from: from || undefined, to: to || undefined, sectorId: sectorId || undefined, machineId: machineId || undefined };
  const reportsQuery = useQuery({
    queryKey: ["reports", companyId, filters],
    queryFn: () => repositories.reports.list(companyId, filters),
  });

  const sectorOptions = useMemo(() => (sectorsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })), [sectorsQuery.data]);
  const machineOptions = useMemo(() => (machinesQuery.data ?? []).map((m) => ({ value: m.id, label: m.name })), [machinesQuery.data]);

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setSectorId("");
    setMachineId("");
  };
  const hasFilters = !!from || !!to || !!sectorId || !!machineId;

  const handleExport = () => {
    const rows = reportsQuery.data ?? [];
    if (rows.length === 0) {
      toast({ title: "Nao ha dados para exportar.", variant: "warning" });
      return;
    }
    const csv = toCsv<ReportRow>(rows, [
      { key: "datetime", label: "Data/Hora" },
      { key: "sectorName", label: "Setor" },
      { key: "machineName", label: "Maquina" },
      { key: "oee", label: "OEE (%)" },
      { key: "availability", label: "Disponibilidade (%)" },
      { key: "productivity", label: "Produtividade (%)" },
      { key: "quality", label: "Qualidade (%)" },
      { key: "horimeterHours", label: "Horimetro (h)" },
      { key: "vibrationMax", label: "Vibracao max (mm/s)" },
      { key: "temperatureMax", label: "Temperatura max (C)" },
      { key: "production", label: "Producao" },
      { key: "productionUnit", label: "Unidade" },
    ]);
    downloadCsv(`relatorio-tai-project-${format(new Date(), "yyyyMMdd-HHmm")}.csv`, csv);
    toast({ title: "Relatorio exportado com sucesso.", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb current="Relatorios" />
          <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
            Relatorios
          </h1>
        </div>
        <Button onClick={handleExport} variant="secondary">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Filtrar relatorios</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-semibold uppercase tracking-wide text-brand-light hover:underline">
              Limpar todos
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-caps mb-1.5 block">De</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">Ate</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
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
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-panel-border px-4 py-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Registros</p>
          <p className="label-caps">Tabela de relatorios</p>
        </div>

        {reportsQuery.isLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {reportsQuery.isError && (
          <ErrorState
            message={(reportsQuery.error as Error)?.message ?? "Erro desconhecido."}
            onRetry={() => reportsQuery.refetch()}
          />
        )}

        {reportsQuery.isSuccess && reportsQuery.data.length === 0 && (
          <EmptyState
            icon={<BarChart3 className="h-10 w-10" />}
            title="Nenhum registro encontrado"
            description="Ajuste os filtros de periodo, setor ou maquina."
          />
        )}

        {reportsQuery.isSuccess && reportsQuery.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-panel-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Data/Hora</th>
                  <th className="px-4 py-3 font-semibold">Setor/Maquina</th>
                  <th className="px-4 py-3 font-semibold">OEE / D/P/Q</th>
                  <th className="px-4 py-3 font-semibold">Horimetro</th>
                  <th className="px-4 py-3 font-semibold">Vibr. max</th>
                  <th className="px-4 py-3 font-semibold">Temp. max</th>
                  <th className="px-4 py-3 font-semibold">Prod. atual</th>
                  <th className="px-4 py-3 font-semibold">Variaveis</th>
                </tr>
              </thead>
              <tbody>
                {reportsQuery.data.map((row) => (
                  <tr key={row.id} className="border-b border-panel-border last:border-0 hover:bg-navy-800/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-200">{format(parseISO(row.datetime), "dd/MM/yyyy")}</p>
                      <p className="text-xs text-muted">{format(parseISO(row.datetime), "HH:mm")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-light">{row.sectorName}</p>
                      <p className="text-xs text-muted">{row.machineName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-brand-light">{row.oee}%</p>
                      <p className="text-xs text-muted">{row.availability}% / {row.productivity}% / {row.quality}%</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.horimeterHours}h</td>
                    <td className="px-4 py-3 text-warning-light">{row.vibrationMax.toFixed(2)}</td>
                    <td className="px-4 py-3 text-danger-light">{row.temperatureMax.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {row.production} {row.productionUnit}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="brand">{row.additionalVariablesCount} variaveis</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
