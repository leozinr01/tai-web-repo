import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useCreateUser } from "@/features/settings/queries";
import { QuickCreateUserDialog } from "@/features/appointments/components/quick-create-user-dialog";
import { toast } from "@/hooks/use-toast";
import { workOrderSchema, type WorkOrderFormValues } from "@/domain/schemas/work-order.schema";
import { WorkOrderPeriodicity } from "@/domain/types/enums";
import { workOrderPeriodicityLabels } from "@/lib/labels";
import type { Sector } from "@/domain/entities/sector";
import type { Machine } from "@/domain/entities/machine";
import type { User } from "@/domain/entities/user";

interface WorkOrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WorkOrderFormValues) => Promise<void>;
  isSubmitting: boolean;
  companyId: string;
  sectors: Sector[];
  machines: Machine[];
  users: User[];
}

const periodicityOptions = Object.entries(workOrderPeriodicityLabels).map(([value, label]) => ({ value, label }));

export function WorkOrderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  companyId,
  sectors,
  machines,
  users,
}: WorkOrderFormDialogProps) {
  const [extraUsers, setExtraUsers] = useState<User[]>([]);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const createUserMutation = useCreateUser();

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
      date: "",
      periodicity: WorkOrderPeriodicity.SEMANAL,
    },
  });

  const handleFormSubmit = async (values: WorkOrderFormValues) => {
    await onSubmit(values);
    reset({
      sectorId: "",
      machineId: "",
      executorId: "",
      description: "",
      date: "",
      periodicity: WorkOrderPeriodicity.SEMANAL,
    });
  };

  const sectorId = watch("sectorId");
  const machineOptions = useMemo(
    () => machines.filter((m) => !sectorId || m.sectorId === sectorId).map((m) => ({ value: m.id, label: m.name })),
    [machines, sectorId],
  );
  const sectorOptions = useMemo(() => sectors.map((s) => ({ value: s.id, label: s.name })), [sectors]);
  const allUsers = useMemo(() => {
    const merged = [...users];
    for (const u of extraUsers) if (!merged.some((m) => m.id === u.id)) merged.push(u);
    return merged;
  }, [users, extraUsers]);
  const userOptions = useMemo(() => allUsers.map((u) => ({ value: u.id, label: u.name })), [allUsers]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Nova ordem de servico"
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
            form="work-order-form"
            type="submit"
            isLoading={isSubmitting}
            className="flex-1 rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20 active:scale-95"
          >
            Criar O.S.
          </Button>
        </div>
      }
    >
      <form id="work-order-form" onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required className="text-[10px] tracking-widest pl-1">
              Setor
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
                  className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
                />
              )}
            />
            <FieldError message={errors.sectorId?.message} />
          </div>
          <div>
            <FieldLabel required className="text-[10px] tracking-widest pl-1">
              Máquina
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
                  className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
                />
              )}
            />
            <FieldError message={errors.machineId?.message} />
          </div>
        </div>

        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Executor responsável
          </FieldLabel>
          <div className="flex items-start gap-2">
            <div className="flex-1">
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
                    className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
                  />
                )}
              />
              <FieldError message={errors.executorId?.message} />
            </div>
            <button
              type="button"
              onClick={() => setQuickCreateOpen(true)}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-brand text-white transition-colors hover:bg-brand-hover"
              aria-label="Cadastrar novo usuário"
              title="Cadastrar novo usuário"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required className="text-[10px] tracking-widest pl-1">
              Periodicidade
            </FieldLabel>
            <Controller
              control={control}
              name="periodicity"
              render={({ field }) => (
                <SearchableSelect
                  options={periodicityOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione..."
                  error={errors.periodicity?.message}
                  className="h-auto rounded-xl px-4 py-3 text-sm font-bold"
                />
              )}
            />
            <FieldError message={errors.periodicity?.message} />
          </div>
          <div>
            <FieldLabel required className="text-[10px] tracking-widest pl-1">
              Próxima execução
            </FieldLabel>
            <Input type="date" error={errors.date?.message} className="h-auto rounded-xl px-4 py-3 text-sm" {...register("date")} />
            <FieldError message={errors.date?.message} />
          </div>
        </div>

        <div>
          <FieldLabel required className="text-[10px] tracking-widest pl-1">
            Descrição do serviço
          </FieldLabel>
          <textarea
            rows={4}
            placeholder="O que precisa ser feito?"
            className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>
      </form>

      <QuickCreateUserDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        companyId={companyId}
        isSubmitting={createUserMutation.isPending}
        onSubmit={(data) => createUserMutation.mutateAsync(data)}
        onCreated={(user) => {
          setExtraUsers((prev) => [...prev, user]);
          setValue("executorId", user.id);
          setQuickCreateOpen(false);
          toast({ title: "Usuário cadastrado com sucesso.", variant: "success" });
        }}
      />
    </Dialog>
  );
}
