import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { alertContactSchema, type AlertContactFormValues } from "@/domain/schemas/alert.schema";
import { alertChannelLabels, formatPhone } from "@/domain/alerts";
import type { AlertChannel, AlertContact } from "@/domain/entities/alert";

const channelOptions = (Object.keys(alertChannelLabels) as AlertChannel[]).map((channel) => ({
  value: channel,
  label: alertChannelLabels[channel],
}));

function toFormValues(contact: AlertContact | null): AlertContactFormValues {
  return {
    name: contact?.name ?? "",
    phone: contact ? formatPhone(contact.phone) : "",
    channel: contact?.channel ?? "whatsapp",
  };
}

export function AlertContactDialog({
  contact,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  contact: AlertContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AlertContactFormValues) => Promise<void>;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<AlertContactFormValues>({ resolver: zodResolver(alertContactSchema), defaultValues: toFormValues(contact) });

  useEffect(() => {
    if (open) reset(toFormValues(contact));
  }, [open, contact, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? "Editar contato" : "Novo contato de alerta"}
      description="Quem recebe os alertas desta empresa"
      size="sm"
      footer={
        <Button form="alert-contact-form" type="submit" isLoading={isSubmitting} className="w-full rounded-2xl py-5 text-sm font-black uppercase">
          Salvar contato
        </Button>
      }
    >
      <form id="alert-contact-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div>
          <FieldLabel>Nome (opcional)</FieldLabel>
          <Input placeholder="Ex.: Supervisor do turno A" error={errors.name?.message} className="h-auto px-4 py-3" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <FieldLabel required>Telefone (WhatsApp)</FieldLabel>
          <Input inputMode="tel" placeholder="(21) 99999-8888" error={errors.phone?.message} className="h-auto px-4 py-3" {...register("phone")} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <FieldLabel>Como avisar</FieldLabel>
          <Controller
            control={control}
            name="channel"
            render={({ field }) => (
              <SearchableSelect
                options={channelOptions}
                value={field.value}
                onChange={field.onChange}
                searchable={false}
                className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
              />
            )}
          />
          <p className="mt-1.5 text-xs text-muted">A ligação só acontece em alertas vermelhos.</p>
        </div>
      </form>
    </Dialog>
  );
}
