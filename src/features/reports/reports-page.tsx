import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, BarChart3, Filter, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
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
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    const rows = reportsQuery.data ?? [];
    if (rows.length === 0) {
      toast({ title: "Não há dados para exportar.", variant: "warning" });
      return;
    }
    const csv = toCsv<ReportRow>(rows, [
      { key: "datetime", label: "Data/Hora" },
      { key: "sectorName", label: "Setor" },
      { key: "machineName", label: "Máquina" },
      { key: "oee", label: "OEE (%)" },
      { key: "availability", label: "Disponibilidade (%)" },
      { key: "productivity", label: "Produtividade (%)" },
      { key: "quality", label: "Qualidade (%)" },
      { key: "horimeterHours", label: "Horímetro (h)" },
      { key: "vibrationMax", label: "Vibração máx (mm/s)" },
      { key: "temperatureMax", label: "Temperatura máx (C)" },
      { key: "production", label: "Produção" },
      { key: "productionUnit", label: "Unidade" },
    ]);
    downloadCsv(`relatorio-tai-project-${format(new Date(), "yyyyMMdd-HHmm")}.csv`, csv);
    toast({ title: "Relatório exportado com sucesso.", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb current="Relatórios" />
          <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
            Relatórios
          </h1>
        </div>
        <Button onClick={handleExport} className="gap-2 rounded-xl border-0 bg-white/5 text-sm font-bold text-white shadow-none hover:bg-white/10">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 p-4">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white">
            <Filter className="h-4 w-4 text-brand-light" /> Filtrar relatórios
          </p>
          <button
            onClick={clearFilters}
            className="text-[10px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
          >
            Limpar todos
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterField label="De">
            <Input
              ref={fromRef}
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              onIconClick={() => fromRef.current?.showPicker?.()}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-11 border-white/20 bg-white/10 text-sm font-bold"
            />
          </FilterField>
          <FilterField label="Até">
            <Input
              ref={toRef}
              type="date"
              leftIcon={<Calendar className="h-4 w-4" />}
              onIconClick={() => toRef.current?.showPicker?.()}
              value={to}
              onChange={(e) => setTo(e.target.value)}
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
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-4">
        <div>
          <p className="text-lg font-bold text-white">Registros</p>
          <p className="text-[10px] uppercase tracking-widest text-muted">Tabela de relatórios</p>
        </div>

        {reportsQuery.isLoading && (
          <div className="space-y-3">
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
            description="Ajuste os filtros de período, setor ou máquina."
          />
        )}

        {reportsQuery.isSuccess && reportsQuery.data.length > 0 && (
          <div className="max-h-[62vh] overflow-auto rounded-xl border border-panel-border">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="sticky top-0 z-10 bg-[#041022]/95 backdrop-blur-xl">
                <tr className="border-b border-panel-border text-[10px] font-bold uppercase tracking-widest text-muted">
                  <th className="px-3 py-3 text-left align-middle">Data/Hora</th>
                  <th className="px-3 py-3 text-left align-middle">Setor/Máquina</th>
                  <th className="px-3 py-3 text-center align-middle">OEE / D/P/Q</th>
                  <th className="px-3 py-3 text-center align-middle">Horímetro</th>
                  <th className="px-3 py-3 text-center align-middle">Vibr. máx</th>
                  <th className="px-3 py-3 text-center align-middle">Temp. máx</th>
                  <th className="px-3 py-3 text-center align-middle">Prod. atual</th>
                  <th className="px-3 py-3 text-left align-middle">Variáveis adicionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reportsQuery.data.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-3 py-3">
                      <p className="text-xs font-bold text-white">{format(parseISO(row.datetime), "dd/MM/yyyy")}</p>
                      <p className="text-[10px] text-muted">{format(parseISO(row.datetime), "HH:mm")}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="truncate text-xs font-bold text-brand">{row.sectorName}</p>
                      <p className="truncate text-[10px] font-medium text-white">{row.machineName}</p>
                    </td>
                    <td className="px-3 py-3 text-center align-middle">
                      <p className="text-xs font-bold text-brand">{row.oee}%</p>
                      <p className="text-[9px] font-bold text-muted">{row.availability}% / {row.productivity}% / {row.quality}%</p>
                    </td>
                    <td className="px-3 py-3 text-center align-middle text-xs font-bold text-white">{row.horimeterHours}h</td>
                    <td className="px-3 py-3 text-center align-middle text-xs font-bold text-warning">{row.vibrationMax.toFixed(2)}</td>
                    <td className="px-3 py-3 text-center align-middle text-xs font-bold text-danger">{row.temperatureMax.toFixed(2)}</td>
                    <td className="px-3 py-3 text-center align-middle text-xs font-bold text-success-light">
                      {row.production} {row.productionUnit}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <details className="group rounded-lg bg-white/5 px-2 py-1.5">
                        <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-widest text-brand [&::-webkit-details-marker]:hidden">
                          {row.additionalVariablesCount} variáveis
                        </summary>
                        <div className="mt-2 grid gap-1">
                          <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-2 py-1">
                            <span className="text-[10px] text-muted">Horímetro (h)</span>
                            <span className="text-[10px] font-semibold text-white">{row.horimeterHours}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-2 py-1">
                            <span className="text-[10px] text-muted">Vibração (mm/s)</span>
                            <span className="text-[10px] font-semibold text-white">{row.vibrationMax.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-2 py-1">
                            <span className="text-[10px] text-muted">Temperatura (°C)</span>
                            <span className="text-[10px] font-semibold text-white">{row.temperatureMax.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-2 py-1">
                            <span className="text-[10px] text-muted">Produção</span>
                            <span className="text-[10px] font-semibold text-white">{row.production} {row.productionUnit}</span>
                          </div>
                        </div>
                      </details>
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
