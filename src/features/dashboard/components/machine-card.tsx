import { Pencil, Settings2, Sliders, AlertTriangle, PlayCircle, PauseCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useDisclosure } from "@/hooks/use-disclosure";
import { machineStatusLabels } from "@/lib/labels";
import { MachineStatus } from "@/domain/types/enums";
import { resolveVariableDisplay } from "@/features/dashboard/machine-variables";
import { useUpdateMachine } from "@/features/dashboard/queries";
import { MachineDrilldownDialog } from "@/features/dashboard/components/machine-drilldown-dialog";
import { MachineCardSettingsDialog } from "@/features/dashboard/components/machine-card-settings-dialog";
import { MachineEditDialog } from "@/features/dashboard/components/machine-edit-dialog";
import type { Machine } from "@/domain/entities/machine";
import type { Sector } from "@/domain/entities/sector";

const statusTone: Record<MachineStatus, "success" | "warning" | "danger"> = {
  [MachineStatus.PRODUZINDO]: "success",
  [MachineStatus.PARADO]: "danger",
  [MachineStatus.EMERGENCIA]: "warning",
};

const statusIcon: Record<MachineStatus, typeof PlayCircle> = {
  [MachineStatus.PRODUZINDO]: PlayCircle,
  [MachineStatus.PARADO]: PauseCircle,
  [MachineStatus.EMERGENCIA]: AlertTriangle,
};

export function MachineCard({
  machine,
  sectorName,
  sectors = [],
}: {
  machine: Machine;
  sectorName?: string;
  sectors?: Sector[];
}) {
  const drilldown = useDisclosure();
  const settingsDialog = useDisclosure();
  const editDialog = useDisclosure();
  const updateMutation = useUpdateMachine();

  const top = machine.cardSettings.topVariableKeys
    .map((key) => resolveVariableDisplay(machine, key))
    .filter((v): v is NonNullable<typeof v> => v !== null);
  const bottom = machine.cardSettings.bottomVariableKeys
    .map((key, i) => ({ display: resolveVariableDisplay(machine, key), visible: machine.cardSettings.bottomVariableVisible[i] }))
    .filter((v): v is { display: NonNullable<ReturnType<typeof resolveVariableDisplay>>; visible: boolean } => v.display !== null);

  const handleSaveSettings = async (settings: Machine["cardSettings"]) => {
    try {
      await updateMutation.mutateAsync({ id: machine.id, data: { cardSettings: settings } });
      toast({ title: "Card atualizado com sucesso.", variant: "success" });
      settingsDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel atualizar o card.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const handleSaveEdit = async (data: { name: string; sectorId: string; customVariables: Machine["customVariables"] }) => {
    try {
      await updateMutation.mutateAsync({ id: machine.id, data });
      toast({ title: "Maquina atualizada com sucesso.", variant: "success" });
      editDialog.close();
    } catch (err) {
      toast({ title: "Nao foi possivel atualizar a maquina.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={drilldown.open}
            className="min-w-0 text-left"
            aria-label={`Ver detalhes de ${machine.name}`}
          >
            <p className="truncate text-lg font-bold text-white hover:text-brand-light">{machine.name}</p>
            <p className="flex items-center gap-1 text-xs text-muted">
              <Settings2 className="h-3 w-3" />
              {sectorName ?? "-"}
            </p>
          </button>
          <div className="flex items-center gap-2">
            <button
              className="text-muted hover:text-slate-200"
              aria-label={`Editar ${machine.name}`}
              onClick={editDialog.open}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <Badge
              tone={statusTone[machine.status]}
              icon={(() => {
                const Icon = statusIcon[machine.status];
                return <Icon className="h-3 w-3" />;
              })()}
            >
              {machineStatusLabels[machine.status]}
            </Badge>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {machine.cardSettings.showOeeCircle ? (
            <button
              type="button"
              onClick={drilldown.open}
              className="flex flex-col items-center justify-center rounded-lg border border-panel-border bg-navy-800 py-4 hover:border-brand"
            >
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-brand">
                <span className="text-sm font-bold text-slate-100">{machine.oeePercent}%</span>
              </div>
              <p className="label-caps mt-2">OEE</p>
            </button>
          ) : (
            <div />
          )}

          <div className="space-y-2 rounded-lg border border-panel-border bg-navy-800 p-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="label-caps">Variaveis</p>
              <button
                type="button"
                onClick={settingsDialog.open}
                className="text-muted hover:text-slate-200"
                aria-label={`Configurar variaveis de ${machine.name}`}
              >
                <Sliders className="h-3.5 w-3.5" />
              </button>
            </div>
            {top.map((v) => (
              <div key={v.key} className="flex items-center justify-between text-xs">
                <span className="text-muted">{v.label}</span>
                <span className="font-semibold text-slate-200">{v.value}</span>
              </div>
            ))}
          </div>
        </div>

        {machine.customVariables.length > 0 && (
          <button
            type="button"
            onClick={editDialog.open}
            className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-light hover:underline"
          >
            Complementares ({machine.customVariables.length})
          </button>
        )}

        {bottom.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {bottom.map(({ display, visible }) =>
              visible ? (
                <div key={display.key} className="rounded-lg border border-panel-border bg-navy-800 p-3">
                  <p className="label-caps">{display.label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-100">{display.value}</p>
                </div>
              ) : (
                <div key={display.key} />
              ),
            )}
          </div>
        )}
      </Card>

      <MachineDrilldownDialog
        open={drilldown.isOpen}
        onOpenChange={drilldown.close}
        machine={machine}
        onOpenSettings={() => {
          drilldown.close();
          settingsDialog.open();
        }}
      />
      <MachineCardSettingsDialog
        open={settingsDialog.isOpen}
        onOpenChange={settingsDialog.close}
        machine={machine}
        onSubmit={handleSaveSettings}
        isSubmitting={updateMutation.isPending}
      />
      <MachineEditDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.close}
        machine={machine}
        sectors={sectors}
        onSubmit={handleSaveEdit}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
}
