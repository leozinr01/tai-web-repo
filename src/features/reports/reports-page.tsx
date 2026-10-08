import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, BarChart3, Filter, Calendar } from "lucide-react";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FilterField } from "@/components/ui/filter-field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { useAuth } from "@/features/auth/use-auth";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import { repositories } from "@/data/repositories";
import { toCsv, downloadCsv } from "@/lib/csv";
import { toast } from "@/hooks/use-toast";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { ReportRow } from "@/domain/entities/report";
import { usePageTitle } from "@/hooks/use-page-title";
import { UserRole } from "@/domain/types/enums";

const PAGE_SIZE = 50;
const FILTER_KEYS = ["de", "ate", "setor", "maquina"] as const;

export function ReportsPage() {
  usePageTitle("Relatórios");
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";
  // Master enxerga os relatorios de todas as empresas (sem filtro de idRef), como no dashboard.
  const scopeCompanyId = user?.role === UserRole.MASTER ? undefined : companyId;

  const { values: urlFilters, setFilter, clearFilters } = useUrlFilters(FILTER_KEYS);
  const { de: from, ate: to, setor: sectorId, maquina: machineId } = urlFilters;
  const setFrom = (value: string) => setFilter("de", value);
  const setTo = (value: string) => setFilter("ate", value);
  const setSectorId = (value: string) => setFilter("setor", value);
  const setMachineId = (value: string) => setFilter("maquina", value);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const sectorsQuery = useSectors(scopeCompanyId);
  const machinesQuery = useMachines(scopeCompanyId, {});

  const filters = { from: from || undefined, to: to || undefined, sectorId: sectorId || undefined, machineId: machineId || undefined };
  // A pagina volta para 1 sempre que algum filtro muda.
  const filtersKey = JSON.stringify(filters);
  const [pageState, setPageState] = useState({ filtersKey, page: 1 });
  const page = pageState.filtersKey === filtersKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ filtersKey, page: next });
  const [isExporting, setIsExporting] = useState(false);

  const reportsQuery = useQuery({
    queryKey: ["reports", scopeCompanyId, filters, page],
    queryFn: () => repositories.reports.list(scopeCompanyId, filters, page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });
  const rows = reportsQuery.data?.items ?? [];

  const sectorOptions = useMemo(() => (sectorsQuery.data ?? []).map((s) => ({ value: s.id, label: s.name })), [sectorsQuery.data]);
  const machineOptions = useMemo(() => (machinesQuery.data ?? []).map((m) => ({ value: m.id, label: m.name })), [machinesQuery.data]);

  const handleExport = async () => {
    // Exporta tudo que bate com os filtros, nao so a pagina que esta na tela.
    setIsExporting(true);
    let allRows: ReportRow[];
    try {
      allRows = await repositories.reports.listAll(scopeCompanyId, filters);
    } catch (err) {
      toast({ title: "Não foi possível exportar.", description: err instanceof Error ? err.message : undefined, variant: "error" });
      return;
    } finally {
      setIsExporting(false);
    }
    if (allRows.length === 0) {
      toast({ title: "Não há dados para exportar.", variant: "warning" });
      return;
    }
    const csv = toCsv<ReportRow>(allRows, [
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
        <Button onClick={handleExport} isLoading={isExporting} className="gap-2 rounded-xl border-0 bg-white/5 text-sm font-bold text-white shadow-none hover:bg-white/10">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 p-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white">
            <Filter className="h-4 w-4 text-brand-light" /> Filtrar relatórios
          </p>
          <button
            onClick={clearFilters}
            className="text-[11px] font-bold uppercase tracking-widest text-muted transition-colors hover:text-white"
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
              max={to || undefined}
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
              min={from || undefined}
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
          <p className="text-[11px] uppercase tracking-widest text-muted">Tabela de relatórios</p>
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

        {reportsQuery.isSuccess && rows.length === 0 && (
          <EmptyState
            icon={<BarChart3 className="h-10 w-10" />}
            title="Nenhum registro encontrado"
            description="Ajuste os filtros de período, setor ou máquina."
          />
        )}

        {reportsQuery.isSuccess && rows.length > 0 && (
          <div>
            <div className="max-h-[62vh] overflow-auto rounded-xl border border-panel-border">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="sticky top-0 z-10 bg-[#041022]/95 backdrop-blur-xl">
                  <tr className="border-b border-panel-border text-[11px] font-bold uppercase tracking-widest text-muted">
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
                  {rows.map((row) => (
                    <tr key={row.id} className="group transition-colors hover:bg-white/5">
                      <td className="px-3 py-3">
                        <p className="text-xs font-bold text-white">{formatDate(row.datetime)}</p>
                        <p className="text-xs text-muted">{formatDate(row.datetime, "HH:mm")}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="truncate text-xs font-bold text-brand">{row.sectorName}</p>
                        <p className="truncate text-xs font-medium text-white">{row.machineName}</p>
                      </td>
                      <td className="px-3 py-3 text-center align-middle">
                        <p className="text-xs font-bold text-brand">{row.oee}%</p>
                        <p className="text-xs font-bold text-muted">{row.availability}% / {row.productivity}% / {row.quality}%</p>
                      </td>
                      <td className="px-3 py-3 text-center align-middle text-xs font-bold text-white">{row.horimeterHours}h</td>
                      <td className="px-3 py-3 text-center align-middle text-xs font-bold text-warning">{row.vibrationMax.toFixed(2)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs font-bold text-danger">{row.temperatureMax.toFixed(2)}</td>
                      <td className="px-3 py-3 text-center align-middle text-xs font-bold text-success-light">
                        {row.production} {row.productionUnit}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <details className="group rounded-lg bg-white/5 px-2 py-1.5">
                          <summary className="cursor-pointer list-none text-[11px] font-bold uppercase tracking-widest text-brand [&::-webkit-details-marker]:hidden">
                            {row.additionalVariablesCount} variáveis
                          </summary>
                          {/* Lista o que o equipamento gravou no registro, nao so as quatro colunas ja exibidas na linha. */}
                          <div className="mt-2 grid gap-1">
                            {row.additionalVariables.length === 0 && (
                              <p className="px-2 py-1 text-xs text-muted">Nenhuma variável neste registro.</p>
                            )}
                            {row.additionalVariables.map((variable) => (
                              <div
                                key={variable.label}
                                className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-2 py-1"
                              >
                                <span className="text-xs text-muted">{variable.label}</span>
                                <span className="text-xs font-semibold text-white">{variable.value}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={reportsQuery.data.total} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
