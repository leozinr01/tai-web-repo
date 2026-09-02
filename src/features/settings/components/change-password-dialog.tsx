import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/domain/schemas/auth.schema";

export function ChangePasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ChangePasswordFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "" },
  });

  useEffect(() => {
    if (open) reset({ password: "" });
  }, [open, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mudar minha senha"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="change-password-form" type="submit" isLoading={isSubmitting}>
            Atualizar senha
          </Button>
        </div>
      }
    >
      <form id="change-password-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required>Nova senha</FieldLabel>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="********"
            error={errors.password?.message}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>
      </form>
    </Dialog>
  );
}
