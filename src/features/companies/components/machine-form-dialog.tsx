import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Sector } from "@/domain/entities/sector";
import type { Machine, MachineCustomVariable } from "@/domain/entities/machine";
import { uid } from "@/lib/utils";

const machineFormSchema = z.object({
  name: z.string().min(2, "Informe o nome da maquina."),
  sectorId: z.string().min(1, "Selecione um setor."),
});
type MachineFormValues = z.infer<typeof machineFormSchema>;

export function MachineFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initial,
  sectors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: MachineFormValues & { customVariables: MachineCustomVariable[] }) => Promise<void>;
  isSubmitting: boolean;
  initial?: Machine | null;
  sectors: Sector[];
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(machineFormSchema),
    defaultValues: { name: "", sectorId: "" },
  });
  const [customVariables, setCustomVariables] = useState<MachineCustomVariable[]>([]);

  useEffect(() => {
    if (open) {
      reset({ name: initial?.name ?? "", sectorId: initial?.sectorId ?? "" });
      setCustomVariables(initial?.customVariables ?? []);
    }
  }, [open, initial, reset]);

  const sectorOptions = sectors.map((s) => ({ value: s.id, label: s.name }));

  const addVariable = () => {
    setCustomVariables((prev) => [...prev, { id: uid("var"), label: "", value: "" }]);
  };
  const removeVariable = (id: string) => {
    setCustomVariables((prev) => prev.filter((v) => v.id !== id));
  };
  const updateVariable = (id: string, patch: Partial<MachineCustomVariable>) => {
    setCustomVariables((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  };

  const submit = handleSubmit((values) => onSubmit({ ...values, customVariables }));

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar máquina" : "Cadastrar nova máquina"}
      titleClassName="uppercase tracking-tight"
      description="Vincule a infraestrutura à empresa selecionada"
      size="sm"
      footer={
        <Button
          form="machine-form"
          type="submit"
          isLoading={isSubmitting}
          className="h-auto w-full py-4 text-xs font-black uppercase tracking-wide"
        >
          {initial ? "Salvar máquina" : "Cadastrar máquina"}
        </Button>
      }
    >
      <form id="machine-form" onSubmit={submit} noValidate className="space-y-4">
        <div>
          <FieldLabel>Nome da máquina</FieldLabel>
          <Input placeholder="Ex: Compressor 1" error={errors.name?.message} {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <FieldLabel>Setor</FieldLabel>
          <Controller
            control={control}
            name="sectorId"
            render={({ field }) => (
              <SearchableSelect
                options={sectorOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Selecione um setor"
                error={errors.sectorId?.message}
              />
            )}
          />
          <FieldError message={errors.sectorId?.message} />
          <p className="mt-1.5 text-[10px] italic text-muted">
            A máquina deve ser vinculada a um setor existente para esta empresa.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <FieldLabel>Variáveis adicionais</FieldLabel>
            <button
              type="button"
              onClick={addVariable}
              className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-brand-light hover:bg-brand/20"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>

          {customVariables.length === 0 ? (
            <p className="mt-2 text-[10px] italic text-muted">Nenhuma variável adicional cadastrada.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {customVariables.map((v) => (
                <div key={v.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome"
                    value={v.label}
                    onChange={(e) => updateVariable(v.id, { label: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Valor"
                    value={v.value}
                    onChange={(e) => updateVariable(v.id, { value: e.target.value })}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariable(v.id)}
                    className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger-light"
                    aria-label="Remover variável"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Dialog>
  );
}
