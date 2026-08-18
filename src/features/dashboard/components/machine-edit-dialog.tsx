import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { uid } from "@/lib/utils";
import type { Machine, MachineCustomVariable } from "@/domain/entities/machine";
import type { Sector } from "@/domain/entities/sector";

interface MachineEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine;
  sectors: Sector[];
  onSubmit: (data: { name: string; sectorId: string; customVariables: MachineCustomVariable[] }) => Promise<void>;
  isSubmitting: boolean;
}

export function MachineEditDialog({
  open,
  onOpenChange,
  machine,
  sectors,
  onSubmit,
  isSubmitting,
}: MachineEditDialogProps) {
  const [name, setName] = useState(machine.name);
  const [sectorId, setSectorId] = useState(machine.sectorId);
  const [customVariables, setCustomVariables] = useState<MachineCustomVariable[]>(machine.customVariables);
  const [addingVariable, setAddingVariable] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    if (open) {
      setName(machine.name);
      setSectorId(machine.sectorId);
      setCustomVariables(machine.customVariables);
      setAddingVariable(false);
      setNewLabel("");
      setNewValue("");
    }
  }, [open, machine]);

  const sectorOptions = sectors.map((s) => ({ value: s.id, label: s.name }));

  const addVariable = () => {
    if (!newLabel.trim()) return;
    setCustomVariables((vars) => [...vars, { id: uid("var"), label: newLabel.trim(), value: newValue.trim() }]);
    setNewLabel("");
    setNewValue("");
    setAddingVariable(false);
  };

  const removeVariable = (id: string) => {
    setCustomVariables((vars) => vars.filter((v) => v.id !== id));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Maquina"
      size="md"
      footer={
        <Button
          className="w-full uppercase tracking-wide"
          isLoading={isSubmitting}
          onClick={() => onSubmit({ name, sectorId, customVariables })}
        >
          Atualizar maquina
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label-caps mb-1.5 block">Nome da maquina</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="label-caps mb-1.5 block">Setor</label>
          <SearchableSelect options={sectorOptions} value={sectorId} onChange={setSectorId} />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="label-caps">Variaveis adicionais</p>
            <button
              type="button"
              onClick={() => setAddingVariable(true)}
              className="rounded-lg bg-brand/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brand-light hover:bg-brand hover:text-white"
            >
              <Plus className="mr-1 inline h-3 w-3" /> Adicionar
            </button>
          </div>

          {customVariables.length === 0 && !addingVariable && (
            <p className="text-xs text-muted">
              Nenhuma variavel adicional cadastrada.
              <br />
              Essas variaveis ficam vinculadas a esta maquina e tambem aparecem como opcoes nos cards do dashboard.
            </p>
          )}

          {customVariables.length > 0 && (
            <ul className="space-y-2">
              {customVariables.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span className="truncate text-slate-200">
                    {v.label}
                    {v.value && <span className="text-muted"> - {v.value}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVariable(v.id)}
                    className="shrink-0 text-muted hover:text-danger-light"
                    aria-label={`Remover ${v.label}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {addingVariable && (
            <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
              <Input placeholder="Nome da variavel" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              <Input placeholder="Valor" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setAddingVariable(false)}>
                  Cancelar
                </Button>
                <Button size="sm" className="flex-1" onClick={addVariable}>
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
