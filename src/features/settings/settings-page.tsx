import { useEffect, useRef, useState } from "react";
import { Upload, UserPlus, Trash2, KeyRound } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  useRemoveUser,
  useChangePassword,
} from "@/features/settings/queries";
import { UserFormDialog } from "@/features/settings/components/user-form-dialog";
import { ChangePasswordDialog } from "@/features/settings/components/change-password-dialog";
import {
  MAX_LOGO_SIZE_BYTES,
  ACCEPTED_LOGO_TYPES,
  companyProfileSchema,
  type UserAccessFormValues,
} from "@/domain/schemas/settings.schema";
import type { ChangePasswordFormValues } from "@/domain/schemas/auth.schema";
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
  const removeUserMutation = useRemoveUser();
  const changePasswordMutation = useChangePassword();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [manualLogoUrl, setManualLogoUrl] = useState("");
  const [manualLogoError, setManualLogoError] = useState<string | null>(null);

  useEffect(() => {
    setManualLogoUrl(companyQuery.data?.logoUrl ?? "");
  }, [companyQuery.data?.logoUrl]);

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoPreview, companyQuery.data?.logoUrl]);

  const userDialog = useDisclosure();
  const removeDialog = useDisclosure();
  const [removingUser, setRemovingUser] = useState<User | null>(null);
  const passwordDialog = useDisclosure();

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

  const handleUserSubmit = async (values: UserAccessFormValues) => {
    try {
      await createUserMutation.mutateAsync({ ...values, companyId, status: UserStatus.ACTIVE });
      toast({ title: "Novo acesso criado.", variant: "success" });
      userDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel salvar o acesso.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const handleRemoveUser = async () => {
    if (!removingUser) return;
    try {
      await removeUserMutation.mutateAsync({ id: removingUser.id, companyId });
      toast({ title: "Acesso removido.", variant: "success" });
      removeDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel remover o acesso.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync(values.password);
      toast({ title: "Senha atualizada com sucesso.", variant: "success" });
      passwordDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel atualizar a senha.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const displayedLogo = logoPreview ?? companyQuery.data?.logoUrl;
  const showLogoImage = Boolean(displayedLogo) && !logoLoadFailed;

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
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                {showLogoImage ? (
                  <img
                    src={displayedLogo}
                    alt="Logotipo da empresa"
                    className="h-24 max-w-[300px] object-contain"
                    onError={() => setLogoLoadFailed(true)}
                  />
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
                  className="h-auto border-0 bg-brand/10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-brand hover:bg-brand hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5" /> Fazer upload
                </Button>
                {logoError && <p className="text-xs text-danger">{logoError}</p>}
              </div>

              <div className="mt-4">
                <FieldLabel>URL do logo (manual)</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={manualLogoUrl}
                    onChange={(e) => setManualLogoUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                    error={manualLogoError ?? undefined}
                    className="h-[46px] flex-1 px-4"
                  />
                  <Button
                    onClick={handleSaveManualLogoUrl}
                    isLoading={updateLogoMutation.isPending}
                    className="h-[46px] rounded-xl border-0 bg-brand/20 px-6 text-[10px] font-bold uppercase text-brand hover:bg-brand hover:text-white"
                  >
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
            <Button
              onClick={userDialog.open}
              className="h-auto gap-2 rounded-xl border-0 bg-brand/10 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-brand hover:bg-brand hover:text-white"
            >
              <UserPlus className="h-3.5 w-3.5" /> Novo acesso
            </Button>
          </div>
          <div className="space-y-3 p-4">
            {usersQuery.isLoading &&
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}

            {usersQuery.isSuccess &&
              usersQuery.data.map((u) => (
                <div
                  key={u.id}
                  className="group flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-panel-border bg-white/[0.03] p-4 transition-all hover:border-brand/50 hover:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                      {u.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
                        {u.name}
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/50">
                          {userRoleLabels[u.role]}
                        </span>
                        {u.status === UserStatus.INACTIVE && (
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/50">
                            Inativo
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRemovingUser(u);
                      removeDialog.open();
                    }}
                    className="shrink-0 rounded-lg bg-white/5 p-2 text-muted opacity-0 transition-colors hover:bg-danger/10 hover:text-danger-light group-hover:opacity-100"
                    aria-label={`Remover ${u.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-xl font-bold text-white">Segurança</h3>
        <Button
          variant="outline"
          onClick={passwordDialog.open}
          className="h-auto gap-2 rounded-xl border border-panel-border bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-navy-700"
        >
          <KeyRound className="h-4 w-4" /> Mudar minha senha
        </Button>
      </Card>

      <UserFormDialog
        open={userDialog.isOpen}
        onOpenChange={userDialog.close}
        onSubmit={handleUserSubmit}
        isSubmitting={createUserMutation.isPending}
      />

      <ConfirmDialog
        open={removeDialog.isOpen}
        onOpenChange={removeDialog.close}
        title="Remover acesso"
        description={`Tem certeza que deseja remover o acesso de ${removingUser?.name}? Essa acao nao pode ser desfeita.`}
        onConfirm={handleRemoveUser}
        isLoading={removeUserMutation.isPending}
        confirmLabel="Remover"
        variant="danger"
      />

      <ChangePasswordDialog
        open={passwordDialog.isOpen}
        onOpenChange={passwordDialog.close}
        onSubmit={handleChangePassword}
        isSubmitting={changePasswordMutation.isPending}
      />
    </div>
  );
}
