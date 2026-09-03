import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  userAccessSchema,
  userAccessCreateSchema,
  type UserAccessFormValues,
} from "@/domain/schemas/settings.schema";
import { UserRole } from "@/domain/types/enums";
import { userRoleLabels } from "@/lib/labels";

const roleOptions = Object.entries(userRoleLabels).map(([value, label]) => ({ value, label }));

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserAccessFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserAccessFormValues>({
    resolver: zodResolver(userAccessSchema),
    defaultValues: { name: "", email: "", role: UserRole.OPERATOR },
  });

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | undefined>();

  useEffect(() => {
    if (open) {
      reset({ name: "", email: "", role: UserRole.OPERATOR });
      setPassword("");
      setPasswordError(undefined);
    }
  }, [open, reset]);

  const submit = handleSubmit((values) => {
    const result = userAccessCreateSchema.shape.password.safeParse(password);
    if (!result.success) {
      setPasswordError(result.error.issues[0]?.message);
      return;
    }
    setPasswordError(undefined);
    return onSubmit(values);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cadastrar Novo Acesso na Empresa"
      description="Defina nome, login e o nível de acesso do novo usuário da empresa"
      titleClassName="uppercase tracking-tight"
      descriptionClassName="text-xs font-medium"
      closeButtonClassName="rounded-xl border border-white/5 bg-white/5 p-2.5"
      contentClassName="max-w-lg !p-8"
      size="sm"
      footer={
        <Button form="user-access-form" type="submit" isLoading={isSubmitting} className="w-full rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20">
          Cadastrar Usuário
        </Button>
      }
    >
      <form id="user-access-form" onSubmit={submit} noValidate className="space-y-6">
        <div>
          <FieldLabel>Nome do Usuário</FieldLabel>
          <Input
            placeholder="Nome Completo"
            error={errors.name?.message}
            className="h-auto px-4 py-3"
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <FieldLabel>E-mail</FieldLabel>
          <Input
            type="email"
            placeholder="usuario@empresa.com"
            error={errors.email?.message}
            className="h-auto px-4 py-3"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <FieldLabel>Senha Inicial</FieldLabel>
          <Input
            type="password"
            placeholder="********"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            className="h-auto px-4 py-3"
          />
          <FieldError message={passwordError} />
        </div>
        <div>
          <FieldLabel>Tipo de Usuário (Nível)</FieldLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SearchableSelect
                options={roleOptions}
                value={field.value}
                onChange={field.onChange}
                searchable={false}
                error={errors.role?.message}
                className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
              />
            )}
          />
          <FieldError message={errors.role?.message} />
          <p className="mt-1.5 text-[10px] text-muted">Somente Master/Admin podem editar cards do dashboard.</p>
        </div>
      </form>
    </Dialog>
  );
}
