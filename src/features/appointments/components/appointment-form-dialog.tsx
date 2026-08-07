import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, FieldError, FieldLabel } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { appointmentSchema, type AppointmentFormValues } from "@/domain/schemas/appointment.schema";
import { AppointmentArea } from "@/domain/types/enums";
import { appointmentAreaLabels, affectedSegmentOptions } from "@/lib/labels";
import type { Sector } from "@/domain/entities/sector";
import type { Machine } from "@/domain/entities/machine";
import type { User } from "@/domain/entities/user";
import type { Appointment } from "@/domain/entities/appointment";

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
  isSubmitting: boolean;
  sectors: Sector[];
  machines: Machine[];
  users: User[];
  initial?: Appointment | null;
}

const areaOptions = Object.entries(appointmentAreaLabels).map(([value, label]) => ({ value, label }));
const segmentOptions = affectedSegmentOptions.map((s) => ({ value: s, label: s }));

export function AppointmentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  sectors,
  machines,
  users,
  initial,
}: AppointmentFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      sectorId: "",
      machineId: "",
      area: AppointmentArea.OPERACIONAL,
      affectedSegment: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      durationMinutes: 15,
      authorId: "",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              sectorId: initial.sectorId,
              machineId: initial.machineId,
              area: initial.area,
              affectedSegment: initial.affectedSegment,
              date: initial.date,
              time: initial.time,
              durationMinutes: initial.durationMinutes,
              authorId: initial.authorId,
              description: initial.description,
            }
          : {
              sectorId: "",
              machineId: "",
              area: AppointmentArea.OPERACIONAL,
              affectedSegment: "",
              date: format(new Date(), "yyyy-MM-dd"),
              time: format(new Date(), "HH:mm"),
              durationMinutes: 15,
              authorId: "",
              description: "",
            },
      );
    }
  }, [open, initial, reset]);

  const sectorId = watch("sectorId");
  const machineOptions = useMemo(
    () =>
      machines
        .filter((m) => !sectorId || m.sectorId === sectorId)
        .map((m) => ({ value: m.id, label: m.name })),
    [machines, sectorId],
  );
  const sectorOptions = useMemo(() => sectors.map((s) => ({ value: s.id, label: s.name })), [sectors]);
  const userOptions = useMemo(() => users.map((u) => ({ value: u.id, label: u.name })), [users]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar apontamento" : "Novo apontamento"}
      description="Preencha os campos para registrar a operacao"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="appointment-form" type="submit" isLoading={isSubmitting}>
            Salvar apontamento
          </Button>
        </div>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required>Qual setor?</FieldLabel>
          <Controller
            control={control}
            name="sectorId"
            render={({ field }) => (
              <SearchableSelect
                options={sectorOptions}
                value={field.value}
                onChange={(v) => {
                  field.onChange(v);
                  setValue("machineId", "");
                }}
                placeholder="Selecione..."
                error={errors.sectorId?.message}
              />
            )}
          />
          <FieldError message={errors.sectorId?.message} />
        </div>

        <div>
          <FieldLabel required>Qual maquina?</FieldLabel>
          <Controller
            control={control}
            name="machineId"
            render={({ field }) => (
              <SearchableSelect
                options={machineOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione..."
                disabled={!sectorId}
                error={errors.machineId?.message}
              />
            )}
          />
          <FieldError message={errors.machineId?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Area do apontamento</FieldLabel>
            <Controller
              control={control}
              name="area"
              render={({ field }) => (
                <SearchableSelect
                  options={areaOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione..."
                  error={errors.area?.message}
                />
              )}
            />
            <FieldError message={errors.area?.message} />
          </div>
          <div>
            <FieldLabel required>Segmento afetado</FieldLabel>
            <Controller
              control={control}
              name="affectedSegment"
              render={({ field }) => (
                <SearchableSelect
                  options={segmentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione..."
                  error={errors.affectedSegment?.message}
                />
              )}
            />
            <FieldError message={errors.affectedSegment?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <FieldLabel required>Data de lancamento</FieldLabel>
            <Input type="date" error={errors.date?.message} {...register("date")} />
            <FieldError message={errors.date?.message} />
          </div>
          <div>
            <FieldLabel required>Hora do lancamento</FieldLabel>
            <Input type="time" error={errors.time?.message} {...register("time")} />
            <FieldError message={errors.time?.message} />
          </div>
          <div>
            <FieldLabel required>Duracao (min)</FieldLabel>
            <Input
              type="number"
              min={1}
              error={errors.durationMinutes?.message}
              {...register("durationMinutes")}
            />
            <FieldError message={errors.durationMinutes?.message} />
          </div>
        </div>

        <div>
          <FieldLabel required>Qual seu nome?</FieldLabel>
          <Controller
            control={control}
            name="authorId"
            render={({ field }) => (
              <SearchableSelect
                options={userOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione..."
                error={errors.authorId?.message}
              />
            )}
          />
          <FieldError message={errors.authorId?.message} />
        </div>

        <div>
          <FieldLabel required>Apontamento</FieldLabel>
          <textarea
            rows={4}
            placeholder="Descreva aqui os detalhes tecnicos..."
            className="w-full rounded-lg border border-panel-border bg-navy-800 px-3 py-2 text-sm text-slate-100 placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>
      </form>
    </Dialog>
  );
}
