import { Pencil, Gauge, Thermometer, Activity, Gauge as SpeedIcon, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { machineStatusLabels } from "@/lib/labels";
import { MachineStatus } from "@/domain/types/enums";
import type { Machine } from "@/domain/entities/machine";

const statusTone: Record<MachineStatus, "success" | "warning" | "danger"> = {
  [MachineStatus.PRODUZINDO]: "success",
  [MachineStatus.PARADO]: "warning",
  [MachineStatus.EMERGENCIA]: "danger",
};

const HIGH_VIBRATION = 0.55;
const HIGH_TEMPERATURE = 40;

export function MachineCard({ machine, sectorName }: { machine: Machine; sectorName?: string }) {
  const highVibration = machine.variables.vibrationMm >= HIGH_VIBRATION;
  const highTemperature = machine.variables.temperatureC >= HIGH_TEMPERATURE;

  return (
    <Card
      className={cn(
        "p-4",
        machine.status === MachineStatus.EMERGENCIA && "border-danger/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-slate-100">{machine.name}</p>
          <p className="flex items-center gap-1 text-xs text-muted">
            <Settings2 className="h-3 w-3" />
            {sectorName ?? "-"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-muted hover:text-slate-200" aria-label={`Editar ${machine.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <Badge tone={statusTone[machine.status]}>{machineStatusLabels[machine.status]}</Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-lg border border-panel-border bg-navy-800 py-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-brand">
            <span className="text-sm font-bold text-slate-100">{machine.oeePercent}%</span>
          </div>
          <p className="label-caps mt-2">OEE</p>
        </div>

        <div className="space-y-2 rounded-lg border border-panel-border bg-navy-800 p-3">
          <p className="label-caps mb-1">Variaveis</p>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <Activity className="h-3.5 w-3.5" /> Horimetro
            </span>
            <span className="font-semibold text-slate-200">{machine.variables.horimeterHours} hs</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={cn("flex items-center gap-1.5", highVibration ? "text-warning-light" : "text-muted")}>
              <Gauge className="h-3.5 w-3.5" /> Vibracao
            </span>
            <span className={cn("font-semibold", highVibration ? "text-warning-light" : "text-slate-200")}>
              {machine.variables.vibrationMm.toFixed(2)} mm/s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={cn("flex items-center gap-1.5", highTemperature ? "text-danger-light" : "text-muted")}>
              <Thermometer className="h-3.5 w-3.5" /> Temperatura
            </span>
            <span className={cn("font-semibold", highTemperature ? "text-danger-light" : "text-slate-200")}>
              {machine.variables.temperatureC.toFixed(2)} C
            </span>
          </div>
        </div>
      </div>

      <button className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-light hover:underline">
        Complementares ({machine.complementaryCount})
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-panel-border bg-navy-800 p-3">
          <p className="label-caps flex items-center gap-1">
            <SpeedIcon className="h-3 w-3" /> Velocidade atual
          </p>
          <p className="mt-1 text-sm font-bold text-slate-100">
            {machine.variables.speed} {machine.variables.speedUnit}
          </p>
        </div>
        <div className="rounded-lg border border-panel-border bg-navy-800 p-3">
          <p className="label-caps">Producao atual</p>
          <p className="mt-1 text-sm font-bold text-slate-100">
            {machine.variables.productionAmount} {machine.variables.productionUnit}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
            <div className="h-full rounded-full bg-success" style={{ width: "62%" }} />
          </div>
        </div>
      </div>
    </Card>
  );
}
