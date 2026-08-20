import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { builtinVariableOptions } from "@/features/dashboard/machine-variables";
import type { MachineCardSettings, MachineVariableKey } from "@/domain/entities/machine";

export const DEFAULT_CARD_SETTINGS: MachineCardSettings = {
  showOeeCircle: true,
  topVariableKeys: ["horimeter", "vibration", "temperature"],
  bottomVariableKeys: ["speed", "production"],
  bottomVariableVisible: [true, true],
};

interface DefaultCardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (settings: MachineCardSettings) => Promise<void>;
  isSubmitting: boolean;
}

export function DefaultCardSettingsDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: DefaultCardSettingsDialogProps) {
  const [settings, setSettings] = useState<MachineCardSettings>(DEFAULT_CARD_SETTINGS);

  useEffect(() => {
    if (open) setSettings(DEFAULT_CARD_SETTINGS);
  }, [open]);

  const options = builtinVariableOptions();

  const setTop = (index: 0 | 1 | 2, value: MachineVariableKey) => {
    setSettings((s) => {
      const next = [...s.topVariableKeys] as MachineCardSettings["topVariableKeys"];
      next[index] = value;
      return { ...s, topVariableKeys: next };
    });
  };

  const setBottom = (index: 0 | 1, value: MachineVariableKey) => {
    setSettings((s) => {
      const next = [...s.bottomVariableKeys] as MachineCardSettings["bottomVariableKeys"];
      next[index] = value;
      return { ...s, bottomVariableKeys: next };
    });
  };

  const toggleBottomVisible = (index: 0 | 1) => {
    setSettings((s) => {
      const next = [...s.bottomVariableVisible] as MachineCardSettings["bottomVariableVisible"];
      next[index] = !next[index];
      return { ...s, bottomVariableVisible: next };
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Variáveis padrão dos cards"
      description="Configure as variáveis exibidas na área superior e nos 2 cards inferiores do dashboard."
      size="lg"
      footer={
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button size="lg" className="w-full" isLoading={isSubmitting} onClick={() => onSubmit(settings)}>
            Aplicar a todos os cards
          </Button>
          <Button
            size="lg"
            className="w-full"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-panel-border bg-white/5 px-4 py-4">
          <p className="label-caps">Bloco esquerdo (OEE / mini gráfico)</p>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={settings.showOeeCircle}
              onChange={(e) => setSettings((s) => ({ ...s, showOeeCircle: e.target.checked }))}
              className="h-4 w-4 rounded border-panel-border bg-white/5 accent-brand"
            />
            Mostrar círculo de OEE
          </label>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-panel-border bg-white/5 px-4 py-3">
            <p className="label-caps">Área superior do card (3 variáveis)</p>
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <label className="label-caps block">Variável {i + 1}</label>
                <SearchableSelect
                  options={options}
                  value={settings.topVariableKeys[i]}
                  onChange={(v) => setTop(i as 0 | 1 | 2, v)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1 rounded-xl border border-panel-border bg-white/5 px-4 py-3">
            <p className="label-caps">Cards inferiores (2 variáveis)</p>
            <p className="text-xs text-muted">A barra de progresso só aparece para Velocidade Atual e Produção Atual.</p>
          </div>
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <label className="label-caps block">Card inferior {i + 1}</label>
                <div className="flex items-center gap-2">
                  <SearchableSelect
                    options={options}
                    value={settings.bottomVariableKeys[i]}
                    onChange={(v) => setBottom(i as 0 | 1, v)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => toggleBottomVisible(i as 0 | 1)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-panel-border bg-white/5 text-muted hover:text-slate-200"
                    aria-label={settings.bottomVariableVisible[i] ? "Ocultar" : "Mostrar"}
                  >
                    {settings.bottomVariableVisible[i] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
