import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, FieldError, FieldLabel } from "@/components/ui/input";
import type { Appointment } from "@/domain/entities/appointment";

const quickEditSchema = z.object({
  duration: z.string().regex(/^\d{1,3}:[0-5]\d$/, "Use o formato HH:MM."),
  description: z
    .string()
    .min(3, "Descreva o apontamento com ao menos 3 caracteres.")
    .max(500, "Limite de 500 caracteres."),
});
type QuickEditValues = z.infer<typeof quickEditSchema>;

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseDuration(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}

interface AppointmentQuickEditDialogProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { durationMinutes: number; description: string }) => Promise<void>;
  isSubmitting: boolean;
}

export function AppointmentQuickEditDialog({
  appointment,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: AppointmentQuickEditDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuickEditValues>({
    resolver: zodResolver(quickEditSchema),
    defaultValues: { duration: "00:00", description: "" },
  });

  useEffect(() => {
    if (appointment) {
      reset({ duration: formatDuration(appointment.durationMinutes), description: appointment.description });
    }
  }, [appointment, reset]);

  const handleFormSubmit = (values: QuickEditValues) =>
    onSubmit({ durationMinutes: parseDuration(values.duration), description: values.description });

  return (
    <Dialog
      open={!!appointment}
      onOpenChange={onOpenChange}
      title="Editar apontamento"
      description="Preencha os campos para registrar a operação"
      size="sm"
      titleClassName="uppercase tracking-tight"
      descriptionClassName="text-xs font-medium"
      closeButtonClassName="rounded-xl border border-white/5 bg-white/5 p-2.5"
      footer={
        <div className="flex gap-4 pt-2">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl border-white/10 bg-white/5 py-5 text-sm font-black uppercase active:scale-95"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            form="appointment-quick-edit-form"
            type="submit"
            isLoading={isSubmitting}
            className="flex-1 rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20 active:scale-95"
          >
            Salvar alterações
          </Button>
        </div>
      }
    >
      <form id="appointment-quick-edit-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Duração (tempo)
          </FieldLabel>
          <Input error={errors.duration?.message} className="h-auto rounded-xl px-4 py-3 text-sm" {...register("duration")} />
          <FieldError message={errors.duration?.message} />
        </div>
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Descrição
          </FieldLabel>
          <textarea
            rows={4}
            className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>
      </form>
    </Dialog>
  );
}
