import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { workOrderSchema, type WorkOrderFormValues } from "@/domain/schemas/work-order.schema";
import { WorkOrderStatus } from "@/domain/types/enums";
import { workOrderStatusLabels } from "@/lib/labels";
import type { Sector } from "@/domain/entities/sector";
import type { Machine } from "@/domain/entities/machine";
import type { User } from "@/domain/entities/user";
import type { WorkOrder } from "@/domain/entities/work-order";

interface WorkOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WorkOrderFormValues) => Promise<void>;
  isSubmitting: boolean;
  sectors: Sector[];
  machines: Machine[];
  users: User[];
  initial?: WorkOrder | null;
}

const statusOptions = Object.entries(workOrderStatusLabels).map(([value, label]) => ({ value, label }));

export function WorkOrderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  sectors,
  machines,
  users,
  initial,
}: WorkOrderFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      sectorId: "",
      machineId: "",
      executorId: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      status: WorkOrderStatus.LANCADA,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              sectorId: initial.sectorId,
              machineId: initial.machineId,
              executorId: initial.executorId,
              description: initial.description,
              date: initial.date,
              status: initial.status,
            }
          : {
              sectorId: "",
              machineId: "",
              executorId: "",
              description: "",
              date: format(new Date(), "yyyy-MM-dd"),
              status: WorkOrderStatus.LANCADA,
            },
      );
    }
  }, [open, initial, reset]);

  const sectorId = watch("sectorId");
  const machineOptions = useMemo(
    () => machines.filter((m) => !sectorId || m.sectorId === sectorId).map((m) => ({ value: m.id, label: m.name })),
    [machines, sectorId],
  );
  const sectorOptions = useMemo(() => sectors.map((s) => ({ value: s.id, label: s.name })), [sectors]);
  const userOptions = useMemo(() => users.map((u) => ({ value: u.id, label: u.name })), [users]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar ordem de servico" : "Nova ordem de servico"}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button form="work-order-form" type="submit" isLoading={isSubmitting}>
            Salvar O.S.
          </Button>
        </div>
      }
    >
      <form id="work-order-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Setor</FieldLabel>
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
            <FieldLabel required>Maquina</FieldLabel>
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Executor</FieldLabel>
            <Controller
              control={control}
              name="executorId"
              render={({ field }) => (
                <SearchableSelect
                  options={userOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione..."
                  error={errors.executorId?.message}
                />
              )}
            />
            <FieldError message={errors.executorId?.message} />
          </div>
          <div>
            <FieldLabel required>Status</FieldLabel>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <SearchableSelect
                  options={statusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione..."
                  error={errors.status?.message}
                />
              )}
            />
            <FieldError message={errors.status?.message} />
          </div>
        </div>

        <div>
          <FieldLabel required>Data</FieldLabel>
          <Input type="date" error={errors.date?.message} {...register("date")} />
          <FieldError message={errors.date?.message} />
        </div>

        <div>
          <FieldLabel required>Descricao do servico</FieldLabel>
          <textarea
            rows={4}
            placeholder="Descreva o servico a ser executado..."
            className="w-full rounded-lg border border-panel-border bg-navy-800 px-3 py-2 text-sm text-slate-100 placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>
      </form>
    </Dialog>
  );
}
