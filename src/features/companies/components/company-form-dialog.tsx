import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { companySchema, type CompanyFormValues } from "@/domain/schemas/company.schema";
import type { Company } from "@/domain/entities/company";

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  isSubmitting: boolean;
  initial?: Company | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { name: "", email: "" },
  });

  useEffect(() => {
    if (open) {
      reset(initial ? { name: initial.name, email: initial.email } : { name: "", email: "" });
    }
  }, [open, initial, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar empresa" : "Nova empresa"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="company-form" type="submit" isLoading={isSubmitting}>
            Salvar
          </Button>
        </div>
      }
    >
      <form id="company-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required>Nome da empresa</FieldLabel>
          <Input error={errors.name?.message} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <FieldLabel required>E-mail</FieldLabel>
          <Input type="email" error={errors.email?.message} {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
      </form>
    </Dialog>
  );
}
