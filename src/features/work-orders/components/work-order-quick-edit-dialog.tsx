import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, FieldError, FieldLabel } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { workOrderQuickEditSchema, type WorkOrderQuickEditValues } from "@/domain/schemas/work-order.schema";
import { workOrderStatusLabels } from "@/lib/labels";
import type { WorkOrder } from "@/domain/entities/work-order";

const statusOptions = Object.entries(workOrderStatusLabels).map(([value, label]) => ({ value, label }));

interface WorkOrderQuickEditDialogProps {
  order: WorkOrder | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WorkOrderQuickEditValues) => Promise<void>;
  isSubmitting: boolean;
}

export function WorkOrderQuickEditDialog({ order, onOpenChange, onSubmit, isSubmitting }: WorkOrderQuickEditDialogProps) {
  const {
    handleSubmit,
    control,
    register,
    reset,
    formState: { errors },
  } = useForm<WorkOrderQuickEditValues>({
    resolver: zodResolver(workOrderQuickEditSchema),
    defaultValues: { status: order?.status, executorName: "", description: "" },
  });

  useEffect(() => {
    if (order) {
      reset({ status: order.status, executorName: order.executorName, description: order.description });
    }
  }, [order, reset]);

  return (
    <Dialog
      open={!!order}
      onOpenChange={onOpenChange}
      title="Editar ordem de serviço"
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
            form="work-order-quick-edit-form"
            type="submit"
            isLoading={isSubmitting}
            className="flex-1 rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20 active:scale-95"
          >
            Salvar
          </Button>
        </div>
      }
    >
      <form id="work-order-quick-edit-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Status
          </FieldLabel>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <SearchableSelect
                options={statusOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.status?.message}
                className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
              />
            )}
          />
          <FieldError message={errors.status?.message} />
        </div>

        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Serviço
          </FieldLabel>
          <textarea
            rows={4}
            className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Executor
          </FieldLabel>
          <Input error={errors.executorName?.message} className="h-auto rounded-xl px-4 py-3 text-sm" {...register("executorName")} />
          <FieldError message={errors.executorName?.message} />
        </div>
      </form>
    </Dialog>
  );
}
