import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, FieldError, FieldLabel } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { UserRole, UserStatus } from "@/domain/types/enums";
import { userRoleLabels } from "@/lib/labels";
import type { User } from "@/domain/entities/user";

const quickUserSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Selecione um nível." }) }),
});
type QuickUserValues = z.infer<typeof quickUserSchema>;

const roleOptions = Object.entries(userRoleLabels).map(([value, label]) => ({ value, label }));

interface QuickCreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  isSubmitting: boolean;
  onSubmit: (data: Omit<User, "id" | "createdAt" | "avatarInitials">) => Promise<User>;
  onCreated: (user: User) => void;
}

export function QuickCreateUserDialog({
  open,
  onOpenChange,
  companyId,
  isSubmitting,
  onSubmit,
  onCreated,
}: QuickCreateUserDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<QuickUserValues>({
    resolver: zodResolver(quickUserSchema),
    defaultValues: { name: "", email: "", password: "", role: UserRole.OPERATOR },
  });

  useEffect(() => {
    if (open) reset({ name: "", email: "", password: "", role: UserRole.OPERATOR });
  }, [open, reset]);

  const handleFormSubmit = async (values: QuickUserValues) => {
    const user = await onSubmit({
      companyId,
      name: values.name,
      email: values.email,
      role: values.role,
      status: UserStatus.ACTIVE,
    });
    onCreated(user);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cadastrar novo acesso na empresa"
      description="Defina nome, login e o nível de acesso do novo usuário da empresa"
      size="sm"
      titleClassName="uppercase tracking-tight"
      descriptionClassName="text-xs font-medium"
      closeButtonClassName="rounded-xl border border-white/5 bg-white/5 p-2.5"
      footer={
        <Button
          form="quick-create-user-form"
          type="submit"
          isLoading={isSubmitting}
          className="w-full rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20 active:scale-95"
        >
          Cadastrar usuário
        </Button>
      }
    >
      <form id="quick-create-user-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Nome do usuário
          </FieldLabel>
          <Input placeholder="Nome Completo" error={errors.name?.message} className="h-auto rounded-xl px-4 py-3 text-sm" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            E-mail
          </FieldLabel>
          <Input
            type="email"
            placeholder="usuario@empresa.com"
            error={errors.email?.message}
            className="h-auto rounded-xl px-4 py-3 text-sm"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Senha inicial
          </FieldLabel>
          <Input
            type="password"
            error={errors.password?.message}
            className="h-auto rounded-xl px-4 py-3 text-sm"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Tipo de usuário (nível)
          </FieldLabel>
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <SearchableSelect
                options={roleOptions}
                value={field.value}
                onChange={field.onChange}
                className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
                error={errors.role?.message}
              />
            )}
          />
          <FieldError message={errors.role?.message} />
          <p className="mt-1.5 text-xs text-muted">Somente Master/Admin podem editar cards do dashboard.</p>
        </div>
      </form>
    </Dialog>
  );
}
