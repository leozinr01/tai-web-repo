import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { userAccessSchema, type UserAccessFormValues } from "@/domain/schemas/settings.schema";
import { UserRole } from "@/domain/types/enums";
import { userRoleLabels } from "@/lib/labels";
import type { User } from "@/domain/entities/user";

const roleOptions = Object.entries(userRoleLabels).map(([value, label]) => ({ value, label }));

export function UserFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: UserAccessFormValues) => Promise<void>;
  isSubmitting: boolean;
  initial?: User | null;
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

  useEffect(() => {
    if (open) {
      reset(initial ? { name: initial.name, email: initial.email, role: initial.role } : { name: "", email: "", role: UserRole.OPERATOR });
    }
  }, [open, initial, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar acesso" : "Novo acesso"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="user-access-form" type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      }
    >
      <form id="user-access-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required>Nome</FieldLabel>
          <Input error={errors.name?.message} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <FieldLabel required>E-mail</FieldLabel>
          <Input type="email" error={errors.email?.message} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <FieldLabel required>Perfil</FieldLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SearchableSelect
                options={roleOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione..."
                error={errors.role?.message}
              />
            )}
          />
          <FieldError message={errors.role?.message} />
        </div>
      </form>
    </Dialog>
  );
}
