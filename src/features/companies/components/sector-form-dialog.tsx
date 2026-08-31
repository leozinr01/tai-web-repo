import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import type { Sector } from "@/domain/entities/sector";

const sectorFormSchema = z.object({
  name: z.string().min(2, "Informe o nome do setor."),
});
type SectorFormValues = z.infer<typeof sectorFormSchema>;

export function SectorFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SectorFormValues) => Promise<void>;
  isSubmitting: boolean;
  initial?: Sector | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectorFormValues>({
    resolver: zodResolver(sectorFormSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) reset({ name: initial?.name ?? "" });
  }, [open, initial, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar setor" : "Cadastrar novo setor"}
      titleClassName="uppercase tracking-tight"
      description="Vincule a infraestrutura à empresa selecionada"
      size="sm"
      footer={
        <Button
          form="sector-form"
          type="submit"
          isLoading={isSubmitting}
          className="h-auto w-full py-4 text-xs font-black uppercase tracking-wide"
        >
          {initial ? "Salvar setor" : "Cadastrar setor"}
        </Button>
      }
    >
      <form id="sector-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldLabel>Nome do setor</FieldLabel>
        <Input placeholder="Ex: Usinagem" error={errors.name?.message} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </form>
    </Dialog>
  );
}
