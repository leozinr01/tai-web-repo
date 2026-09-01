import { useEffect, useRef, useState } from "react";
import { Upload, UserPlus, Power, Pencil } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { useDisclosure } from "@/hooks/use-disclosure";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth/auth-context";
import {
  useCompany,
  useCompanyUsers,
  useUpdateCompanyLogo,
  useCreateUser,
  useUpdateUser,
  useSetUserStatus,
} from "@/features/settings/queries";
import { UserFormDialog } from "@/features/settings/components/user-form-dialog";
import {
  MAX_LOGO_SIZE_BYTES,
  ACCEPTED_LOGO_TYPES,
  companyProfileSchema,
  type UserAccessFormValues,
} from "@/domain/schemas/settings.schema";
import { UserStatus } from "@/domain/types/enums";
import { userRoleLabels } from "@/lib/labels";
import type { User } from "@/domain/entities/user";

export function SettingsPage() {
  const { user } = useAuth();
  const companyId = user?.companyId ?? "";

  const companyQuery = useCompany(companyId);
  const usersQuery = useCompanyUsers(companyId);
  const updateLogoMutation = useUpdateCompanyLogo();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const setStatusMutation = useSetUserStatus();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [manualLogoUrl, setManualLogoUrl] = useState("");
  const [manualLogoError, setManualLogoError] = useState<string | null>(null);

  useEffect(() => {
    setManualLogoUrl(companyQuery.data?.logoUrl ?? "");
  }, [companyQuery.data?.logoUrl]);

  const userDialog = useDisclosure();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const toggleDialog = useDisclosure();
  const [toggling, setToggling] = useState<User | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Formato invalido. Use PNG, JPG ou SVG.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError("Arquivo muito grande. Tamanho maximo: 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      try {
        await updateLogoMutation.mutateAsync({ id: companyId, logoUrl: dataUrl });
        toast({ title: "Logotipo atualizado com sucesso.", variant: "success" });
      } catch (err) {
        toast({ title: "Nao foi possivel atualizar o logotipo.", description: err instanceof Error ? err.message : undefined, variant: "error" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveManualLogoUrl = async () => {
    const result = companyProfileSchema.shape.logoUrl.safeParse(manualLogoUrl);
    if (!result.success) {
      setManualLogoError(result.error.issues[0]?.message ?? "URL invalida.");
      return;
    }
    setManualLogoError(null);
    setLogoPreview(null);
    try {
      await updateLogoMutation.mutateAsync({ id: companyId, logoUrl: manualLogoUrl });
      toast({ title: "Logotipo atualizado com sucesso.", variant: "success" });
    } catch (err) {
      toast({ title: "Nao foi possivel atualizar o logotipo.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const openCreateUser = () => {
    setEditingUser(null);
    userDialog.open();
  };
  const openEditUser = (u: User) => {
    setEditingUser(u);
    userDialog.open();
  };

  const handleUserSubmit = async (values: UserAccessFormValues) => {
    try {
      if (editingUser) {
        await updateUserMutation.mutateAsync({ id: editingUser.id, data: values });
        toast({ title: "Acesso atualizado.", variant: "success" });
      } else {
        await createUserMutation.mutateAsync({ ...values, companyId, status: UserStatus.ACTIVE });
        toast({ title: "Novo acesso criado.", variant: "success" });
      }
      userDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel salvar o acesso.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const handleToggleStatus = async () => {
    if (!toggling) return;
    const nextStatus = toggling.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    try {
      await setStatusMutation.mutateAsync({ id: toggling.id, status: nextStatus });
      toast({ title: nextStatus === UserStatus.ACTIVE ? "Usuario ativado." : "Usuario desativado.", variant: "success" });
      toggleDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel atualizar o status.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const displayedLogo = logoPreview ?? companyQuery.data?.logoUrl;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb current="Configuracoes" />
        <h1 className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl">
          Configuracoes
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-200">Perfil da empresa</p>
          {companyQuery.isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <>
              <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-panel-border bg-white/5 p-8 text-center">
                {displayedLogo ? (
                  <img src={displayedLogo} alt="Logotipo da empresa" className="h-24 max-w-[300px] object-contain" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-navy-700 text-muted">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-200">Logo da empresa</p>
                  <p className="text-xs text-muted">PNG, JPG ou SVG (Max. 2MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_LOGO_TYPES.join(",")}
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={updateLogoMutation.isPending}
                  className="border-brand/30 bg-brand/10 text-brand-light hover:bg-brand/20"
                >
                  <Upload className="h-4 w-4" /> Fazer upload
                </Button>
                {logoError && <p className="text-xs text-danger">{logoError}</p>}
              </div>

              <div className="mt-4">
                <FieldLabel>URL do logo (manual)</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={manualLogoUrl}
                    onChange={(e) => setManualLogoUrl(e.target.value)}
                    placeholder="https://..."
                    error={manualLogoError ?? undefined}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSaveManualLogoUrl} isLoading={updateLogoMutation.isPending}>
                    Salvar
                  </Button>
                </div>
                <FieldError message={manualLogoError ?? undefined} />
              </div>
            </>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-panel-border px-6 py-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Gerenciar acessos</p>
            <Button size="sm" onClick={openCreateUser}>
              <UserPlus className="h-4 w-4" /> Novo acesso
            </Button>
          </div>
          <div className="max-h-[420px] divide-y divide-panel-border overflow-y-auto">
            {usersQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}

            {usersQuery.isSuccess &&
              usersQuery.data.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-light">
                      {u.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
                        {u.name}
                        <Badge tone="brand" className="normal-case">{userRoleLabels[u.role]}</Badge>
                        {u.status === UserStatus.INACTIVE && <Badge tone="neutral">Inativo</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEditUser(u)}
                      className="rounded-md p-1.5 text-muted hover:bg-navy-700 hover:text-slate-200"
                      aria-label={`Editar ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setToggling(u);
                        toggleDialog.open();
                      }}
                      className="rounded-md p-1.5 text-muted hover:bg-navy-700 hover:text-slate-200"
                      aria-label={`Alterar status de ${u.name}`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <UserFormDialog
        open={userDialog.isOpen}
        onOpenChange={userDialog.close}
        onSubmit={handleUserSubmit}
        isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
        initial={editingUser}
      />

      <ConfirmDialog
        open={toggleDialog.isOpen}
        onOpenChange={toggleDialog.close}
        title={toggling?.status === UserStatus.ACTIVE ? "Desativar usuario" : "Ativar usuario"}
        description={`Tem certeza que deseja ${toggling?.status === UserStatus.ACTIVE ? "desativar" : "ativar"} o acesso de ${toggling?.name}?`}
        onConfirm={handleToggleStatus}
        isLoading={setStatusMutation.isPending}
        confirmLabel="Confirmar"
        variant="primary"
      />
    </div>
  );
}
