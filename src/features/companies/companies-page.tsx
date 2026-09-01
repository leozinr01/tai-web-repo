import { useState } from "react";
import { Plus, Search, Settings, Pen, Trash2, Building2, Filter } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterField } from "@/components/ui/filter-field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { toast } from "@/hooks/use-toast";
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from "@/features/companies/queries";
import { CompanyFormDialog } from "@/features/companies/components/company-form-dialog";
import { CompanyInfrastructureDialog } from "@/features/companies/components/company-infrastructure-dialog";
import type { CompanyFormValues } from "@/domain/schemas/company.schema";
import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";

export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const companiesQuery = useCompanies(debouncedSearch);
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const formDialog = useDisclosure();
  const [editing, setEditing] = useState<Company | null>(null);
  const deleteDialog = useDisclosure();
  const [toDelete, setToDelete] = useState<Company | null>(null);
  const [managing, setManaging] = useState<Company | null>(null);

  const openCreate = () => {
    setEditing(null);
    formDialog.open();
  };
  const openEdit = (c: Company) => {
    setEditing(c);
    formDialog.open();
  };

  const handleSubmit = async (values: CompanyFormValues) => {
    const { name, email } = values;
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: { name, email } });
        toast({ title: "Empresa atualizada.", variant: "success" });
      } else {
        await createMutation.mutateAsync({ name, email, status: CompanyStatus.ACTIVE, logoUrl: "" });
        toast({ title: "Empresa criada com sucesso.", variant: "success" });
      }
      formDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel salvar a empresa.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast({ title: "Empresa excluida.", variant: "success" });
      deleteDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel excluir a empresa.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb current="Painel Master" />
        <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          Painel Master
        </h1>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 p-4">
          <Filter className="h-4 w-4 text-brand-light" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white">Filtrar empresas</p>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <FilterField label="Busca">
              <Input
                placeholder="Buscar por nome ou email..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 border-white/20 bg-white/10 text-sm font-bold"
              />
            </FilterField>
          </div>
          <Button onClick={openCreate} className="h-auto w-full py-3 font-bold">
            <Plus className="h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/5 p-4">
          <Building2 className="h-4 w-4 text-brand-light" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white">Empresas cadastradas</p>
        </div>

        {companiesQuery.isLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {companiesQuery.isError && (
          <ErrorState
            message={(companiesQuery.error as Error)?.message ?? "Erro desconhecido."}
            onRetry={() => companiesQuery.refetch()}
          />
        )}

        {companiesQuery.isSuccess && companiesQuery.data.length === 0 && (
          <EmptyState
            icon={<Building2 className="h-10 w-10" />}
            title="Nenhuma empresa encontrada"
            description="Ajuste a busca ou cadastre uma nova empresa."
            action={
              <Button onClick={openCreate} size="sm">
                <Plus className="h-4 w-4" /> Nova empresa
              </Button>
            }
          />
        )}

        {companiesQuery.isSuccess && companiesQuery.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-panel-border text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3 text-center">Setores</th>
                  <th className="px-4 py-3 text-center">Máquinas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {companiesQuery.data.map((company) => (
                  <tr key={company.id} className="border-b border-panel-border last:border-0 hover:bg-white/5">
                    <td className="px-4 py-3 text-sm font-bold text-white">{company.name}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-white">{company.sectorsCount}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-white">{company.machinesCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${
                          company.status === CompanyStatus.ACTIVE ? "text-success-light" : "text-muted"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            company.status === CompanyStatus.ACTIVE ? "bg-success-light" : "bg-slate-400"
                          }`}
                        />
                        {company.status === CompanyStatus.ACTIVE ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setManaging(company)}
                          className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-1.5 text-[10px] font-bold text-brand-light transition-all hover:bg-brand hover:text-white"
                        >
                          <Settings className="h-3.5 w-3.5" /> GERENCIAR
                        </button>
                        <button
                          onClick={() => openEdit(company)}
                          className="rounded-lg bg-white/5 p-2 text-muted transition-all hover:bg-brand/10 hover:text-brand-light"
                          aria-label={`Editar ${company.name}`}
                        >
                          <Pen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setToDelete(company); deleteDialog.open(); }}
                          className="rounded-lg bg-white/5 p-2 text-muted transition-all hover:bg-danger/10 hover:text-danger-light"
                          aria-label={`Excluir ${company.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted">
        Criado por <span className="text-brand-light">Tai Project</span>
      </p>

      <CompanyFormDialog
        open={formDialog.isOpen}
        onOpenChange={formDialog.close}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initial={editing}
      />

      <CompanyInfrastructureDialog company={managing} onOpenChange={(open) => !open && setManaging(null)} />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.close}
        title="Excluir empresa"
        description={`Tem certeza que deseja excluir a empresa "${toDelete?.name}"? Esta acao nao pode ser desfeita.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        confirmLabel="Excluir"
      />
    </div>
  );
}
