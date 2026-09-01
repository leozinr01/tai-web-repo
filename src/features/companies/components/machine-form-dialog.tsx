import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn, uid } from "@/lib/utils";
import type { Sector } from "@/domain/entities/sector";
import type { Machine, MachineCustomVariable, MachineVariableType } from "@/domain/entities/machine";

const machineFormSchema = z.object({
  name: z.string().min(2, "Informe o nome da maquina."),
  sectorId: z.string().min(1, "Selecione um setor."),
});
type MachineFormValues = z.infer<typeof machineFormSchema>;

const VARIABLE_TYPE_LABEL: Record<MachineVariableType, string> = {
  int: "INT",
  float: "FLOAT",
  bool: "BOOL",
};

const VARIABLE_VALUE_PLACEHOLDER: Record<MachineVariableType, string> = {
  int: "Valor inteiro",
  float: "Valor decimal",
  bool: "",
};

const VARIABLE_UNITS = [
  "m", "mm", "°C", "K", "g", "mg", "mA", "h", "min", "seg", "bar", "psi", "Pa",
  "m³/h", "m³/s", "L/min", "L/s", "kg/h", "kg/s", "mm/s", "kg", "L", "und", "%",
];

const selectClassName =
  "h-9 shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

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
    setCustomVariables((prev) => [
      ...prev,
      { id: uid("var"), label: "", type: "float", unit: "", value: "", visible: true },
    ]);
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
      title={initial ? "Editar máquina" : "Nova máquina"}
      size="md"
      footer={
        <Button
          form="machine-form"
          type="submit"
          isLoading={isSubmitting}
          className="h-auto w-full py-4 text-xs font-black uppercase tracking-wide"
        >
          {initial ? "Atualizar máquina" : "Cadastrar máquina"}
        </Button>
      }
    >
      <form id="machine-form" onSubmit={submit} noValidate className="space-y-4">
        <div>
          <FieldLabel>Nome da máquina</FieldLabel>
          <Input placeholder="Ex: Torno CNC" error={errors.name?.message} {...register("name")} />
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
                placeholder="Selecione o setor..."
                error={errors.sectorId?.message}
              />
            )}
          />
          <FieldError message={errors.sectorId?.message} />
          <p className="mt-1.5 text-[10px] italic text-muted">
            A máquina deve ser vinculada a um setor existente para esta empresa.
          </p>
        </div>

        <div className="rounded-lg border border-panel-border bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <FieldLabel className="mb-0">Variáveis adicionais</FieldLabel>
            <button
              type="button"
              onClick={addVariable}
              className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-brand-light hover:bg-brand/20"
            >
              Adicionar
            </button>
          </div>

          {customVariables.length === 0 ? (
            <p className="mt-2 text-[10px] italic text-muted">Nenhuma variável adicional cadastrada.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {customVariables.map((v) => (
                <div key={v.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Input
                      placeholder="Nome da variável"
                      value={v.label}
                      onChange={(e) => updateVariable(v.id, { label: e.target.value })}
                      className="h-9 min-w-0 flex-1 text-xs"
                    />
                    <select
                      value={v.type}
                      onChange={(e) => {
                        const type = e.target.value as MachineVariableType;
                        updateVariable(v.id, { type, value: type === "bool" ? "Não" : "" });
                      }}
                      className={cn(selectClassName, "w-[4.75rem]")}
                    >
                      {(Object.keys(VARIABLE_TYPE_LABEL) as MachineVariableType[]).map((type) => (
                        <option key={type} value={type}>
                          {VARIABLE_TYPE_LABEL[type]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={v.unit ?? ""}
                      onChange={(e) => updateVariable(v.id, { unit: e.target.value })}
                      className={cn(selectClassName, "w-24")}
                    >
                      <option value="">Unidade...</option>
                      {VARIABLE_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                    {v.type === "bool" ? (
                      <select
                        value={v.value || "Não"}
                        onChange={(e) => updateVariable(v.id, { value: e.target.value })}
                        className={cn(selectClassName, "w-16")}
                      >
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    ) : (
                      <Input
                        placeholder={VARIABLE_VALUE_PLACEHOLDER[v.type]}
                        value={v.value}
                        onChange={(e) => updateVariable(v.id, { value: e.target.value })}
                        className="h-9 min-w-0 flex-1 text-xs"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeVariable(v.id)}
                      className="h-9 shrink-0 rounded-lg border border-danger/40 bg-danger/10 px-2.5 text-[10px] font-black uppercase tracking-wide text-danger-light hover:bg-danger/20"
                    >
                      Remover
                    </button>
                  </div>
                  {v.type === "bool" && (
                    <button
                      type="button"
                      onClick={() => updateVariable(v.id, { visible: !v.visible })}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
                        v.visible
                          ? "border-success/40 bg-success/10 text-success-light hover:bg-success/20"
                          : "border-white/10 bg-white/5 text-muted hover:bg-white/10",
                      )}
                    >
                      {v.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {v.visible ? "Visível" : "Oculto"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-2 text-[10px] italic text-muted">
            {initial
              ? "Essas variáveis ficam vinculadas a esta máquina e também aparecem como opções nos cards do dashboard."
              : "Configure variáveis do tipo INT, FLOAT ou BOOL já no cadastro da máquina."}
          </p>
        </div>
      </form>
    </Dialog>
  );
}
