import { useState } from "react";
import { Plus, Search, Settings2, Pencil, Trash2, Building2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { toast } from "@/hooks/use-toast";
import {
  useCompanies,
  useCreateCompany,
  useUpdateCompany,
  useToggleCompanyStatus,
  useDeleteCompany,
} from "@/features/companies/queries";
import { CompanyFormDialog } from "@/features/companies/components/company-form-dialog";
import type { CompanyFormValues } from "@/domain/schemas/company.schema";
import type { Company } from "@/domain/entities/company";
import { CompanyStatus } from "@/domain/types/enums";

export function CompaniesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const companiesQuery = useCompanies(debouncedSearch);
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const toggleMutation = useToggleCompanyStatus();
  const deleteMutation = useDeleteCompany();

  const formDialog = useDisclosure();
  const [editing, setEditing] = useState<Company | null>(null);
  const deleteDialog = useDisclosure();
  const [toDelete, setToDelete] = useState<Company | null>(null);
  const toggleDialog = useDisclosure();
  const [toToggle, setToToggle] = useState<Company | null>(null);

  const openCreate = () => {
    setEditing(null);
    formDialog.open();
  };
  const openEdit = (c: Company) => {
    setEditing(c);
    formDialog.open();
  };

  const handleSubmit = async (values: CompanyFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: values });
        toast({ title: "Empresa atualizada.", variant: "success" });
      } else {
        await createMutation.mutateAsync({ ...values, status: CompanyStatus.ACTIVE, logoUrl: "" });
        toast({ title: "Empresa criada com sucesso.", variant: "success" });
      }
      formDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel salvar a empresa.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const handleToggle = async () => {
    if (!toToggle) return;
    try {
      await toggleMutation.mutateAsync(toToggle);
      toast({ title: toToggle.status === CompanyStatus.ACTIVE ? "Empresa desativada." : "Empresa ativada.", variant: "success" });
      toggleDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel atualizar o status.", description: err instanceof Error ? err.message : undefined, variant: "error" });
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

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-200">Filtrar empresas</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Buscar por nome ou email..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nova Empresa
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-panel-border px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            <Building2 className="h-4 w-4 text-brand-light" /> Empresas cadastradas
          </p>
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
                <tr className="border-b border-panel-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Setores</th>
                  <th className="px-4 py-3 font-semibold">Maquinas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {companiesQuery.data.map((company) => (
                  <tr key={company.id} className="border-b border-panel-border last:border-0 hover:bg-navy-800/50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-200">{company.name}</p>
                      <p className="text-xs text-muted">{company.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{company.sectorsCount}</td>
                    <td className="px-4 py-3 text-slate-300">{company.machinesCount}</td>
                    <td className="px-4 py-3">
                      <Badge tone={company.status === CompanyStatus.ACTIVE ? "success" : "neutral"}>
                        {company.status === CompanyStatus.ACTIVE ? "Ativa" : "Inativa"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => { setToToggle(company); toggleDialog.open(); }}>
                          <Settings2 className="h-3.5 w-3.5" /> Gerenciar
                        </Button>
                        <button
                          onClick={() => openEdit(company)}
                          className="rounded-md p-1.5 text-muted hover:bg-navy-700 hover:text-slate-200"
                          aria-label={`Editar ${company.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setToDelete(company); deleteDialog.open(); }}
                          className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger-light"
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
        <div className="border-t border-panel-border py-4 text-center text-[11px] uppercase tracking-widest text-muted">
          Criado por <span className="text-brand-light">Tai Project</span>
        </div>
      </Card>

      <CompanyFormDialog
        open={formDialog.isOpen}
        onOpenChange={formDialog.close}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initial={editing}
      />

      <ConfirmDialog
        open={toggleDialog.isOpen}
        onOpenChange={toggleDialog.close}
        title={toToggle?.status === CompanyStatus.ACTIVE ? "Desativar empresa" : "Ativar empresa"}
        description={`Tem certeza que deseja ${toToggle?.status === CompanyStatus.ACTIVE ? "desativar" : "ativar"} a empresa "${toToggle?.name}"? Usuarios da empresa podem ser afetados.`}
        onConfirm={handleToggle}
        isLoading={toggleMutation.isPending}
        confirmLabel="Confirmar"
        variant="primary"
      />

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
