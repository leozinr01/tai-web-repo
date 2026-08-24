import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, parse } from "date-fns";
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

const formSchema = appointmentSchema.omit({ durationMinutes: true }).extend({
  startTime: z.string().min(1, "Informe o horário de início."),
  endTime: z.string().min(1, "Informe o horário de fim."),
});
type FormValues = z.infer<typeof formSchema>;

function timeToMinutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

function durationBetween(startTime: string, endTime: string): number {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  return diff > 0 ? diff : diff + 24 * 60;
}

function addMinutesToTime(time: string, minutes: number): string {
  return format(addMinutes(parse(time, "HH:mm", new Date()), minutes), "HH:mm");
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
  isSubmitting: boolean;
  sectors: Sector[];
  machines: Machine[];
  users: User[];
  initial?: Appointment | null;
  prefill?: { sectorId: string; machineId: string };
}

const areaOptions = Object.entries(appointmentAreaLabels).map(([value, label]) => ({ value, label }));
const segmentOptions = affectedSegmentOptions.map((s) => ({ value: s, label: s }));

const fieldLabelCls = "text-[10px] tracking-widest pl-1";
const selectFieldCls = "h-auto rounded-xl px-4 py-3 text-sm font-bold";
const inputFieldCls = "h-auto rounded-xl px-4 py-3 text-sm";

export function AppointmentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  sectors,
  machines,
  users,
  initial,
  prefill,
}: AppointmentFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sectorId: "",
      machineId: "",
      area: AppointmentArea.OPERACIONAL,
      affectedSegment: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      startTime: format(new Date(), "HH:mm"),
      endTime: addMinutesToTime(format(new Date(), "HH:mm"), 15),
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
              startTime: initial.time,
              endTime: addMinutesToTime(initial.time, initial.durationMinutes),
              authorId: initial.authorId,
              description: initial.description,
            }
          : {
              sectorId: prefill?.sectorId ?? "",
              machineId: prefill?.machineId ?? "",
              area: AppointmentArea.OPERACIONAL,
              affectedSegment: "",
              date: format(new Date(), "yyyy-MM-dd"),
              time: format(new Date(), "HH:mm"),
              startTime: format(new Date(), "HH:mm"),
              endTime: addMinutesToTime(format(new Date(), "HH:mm"), 15),
              authorId: "",
              description: "",
            },
      );
    }
  }, [open, initial, prefill, reset]);

  const handleFormSubmit = (values: FormValues) => {
    const { startTime, endTime, ...rest } = values;
    const payload: AppointmentFormValues = {
      ...rest,
      durationMinutes: durationBetween(startTime, endTime),
    };
    return onSubmit(payload);
  };

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
            form="appointment-form"
            type="submit"
            isLoading={isSubmitting}
            className="flex-1 rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20 active:scale-95"
          >
            Registrar
          </Button>
        </div>
      }
    >
      <form id="appointment-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required className={fieldLabelCls}>
            Qual setor?
          </FieldLabel>
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
                className={selectFieldCls}
              />
            )}
          />
          <FieldError message={errors.sectorId?.message} />
        </div>

        <div>
          <FieldLabel required className={fieldLabelCls}>
            Qual máquina?
          </FieldLabel>
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
                className={selectFieldCls}
              />
            )}
          />
          <FieldError message={errors.machineId?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required className={fieldLabelCls}>
              Área do apontamento
            </FieldLabel>
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
                  className={selectFieldCls}
                />
              )}
            />
            <FieldError message={errors.area?.message} />
          </div>
          <div>
            <FieldLabel required className={fieldLabelCls}>
              Seguimento afetado
            </FieldLabel>
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
                  className={selectFieldCls}
                />
              )}
            />
            <FieldError message={errors.affectedSegment?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required className={fieldLabelCls}>
              Data de lançamento
            </FieldLabel>
            <Input type="date" error={errors.date?.message} className={inputFieldCls} {...register("date")} />
            <FieldError message={errors.date?.message} />
          </div>
          <div>
            <FieldLabel required className={fieldLabelCls}>
              Hora do lançamento
            </FieldLabel>
            <Input type="time" error={errors.time?.message} className={inputFieldCls} {...register("time")} />
            <FieldError message={errors.time?.message} />
          </div>
        </div>

        <div>
          <FieldLabel required className={fieldLabelCls}>
            Qual seu nome?
          </FieldLabel>
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
                className={selectFieldCls}
              />
            )}
          />
          <FieldError message={errors.authorId?.message} />
        </div>

        <div>
          <FieldLabel required className={fieldLabelCls}>
            Apontamento
          </FieldLabel>
          <textarea
            rows={4}
            placeholder="Descreva aqui os detalhes técnicos..."
            className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required className={fieldLabelCls}>
              Início
            </FieldLabel>
            <Input
              type="time"
              error={errors.startTime?.message}
              className={inputFieldCls}
              {...register("startTime")}
            />
            <FieldError message={errors.startTime?.message} />
          </div>
          <div>
            <FieldLabel required className={fieldLabelCls}>
              Fim
            </FieldLabel>
            <Input type="time" error={errors.endTime?.message} className={inputFieldCls} {...register("endTime")} />
            <FieldError message={errors.endTime?.message} />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
