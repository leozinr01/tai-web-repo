import { useEffect, useState } from "react";
import {
  Pencil,
  Settings,
  Zap,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Clock,
  Radio,
  Thermometer,
  Gauge,
  Package,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useDisclosure } from "@/hooks/use-disclosure";
import { machineStatusLabels } from "@/lib/labels";
import { MachineStatus } from "@/domain/types/enums";
import { resolveVariableDisplay } from "@/features/dashboard/machine-variables";
import { useUpdateMachine } from "@/features/dashboard/queries";
import { MachineDrilldownDialog } from "@/features/dashboard/components/machine-drilldown-dialog";
import { MachineCardSettingsDialog } from "@/features/dashboard/components/machine-card-settings-dialog";
import { MachineFormDialog } from "@/features/companies/components/machine-form-dialog";
import type { Machine, MachineCustomVariable, MachineVariableKey } from "@/domain/entities/machine";
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

const variableIcon: Partial<Record<MachineVariableKey, LucideIcon>> = {
  horimeter: Clock,
  vibration: Radio,
  temperature: Thermometer,
  speed: Gauge,
  production: Package,
};

const OEE_SIZE = 64;
const OEE_STROKE = 4;
const OEE_RADIUS = (OEE_SIZE - OEE_STROKE) / 2;
const OEE_CIRCUMFERENCE = 2 * Math.PI * OEE_RADIUS;

const MAX_SPEED = 100;
const MAX_PRODUCTION = 5000;

function bottomBarPercent(machine: Machine, key: MachineVariableKey): number {
  if (key === "speed") return Math.max(0, Math.min((machine.variables.speed / MAX_SPEED) * 100, 100));
  if (key === "production") return Math.max(0, Math.min((machine.variables.productionAmount / MAX_PRODUCTION) * 100, 100));
  return 100;
}

function useAnimatedPercent(target: number, duration = 1000) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

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
  const animatedOee = useAnimatedPercent(machine.oeePercent);
  const [complementaresOpen, setComplementaresOpen] = useState(false);
  const oeeHistoryData = machine.oeeHistory.map((value) => ({ value }));

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

  const handleSaveEdit = async (data: { name: string; sectorId: string; customVariables: MachineCustomVariable[] }) => {
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
      <Card className="cursor-pointer p-4 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:bg-white/10 active:scale-[0.98]">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={drilldown.open}
            className="min-w-0 text-left"
            aria-label={`Ver detalhes de ${machine.name}`}
          >
            <p className="truncate text-lg font-bold text-white hover:text-brand-light">{machine.name}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted">
              <Zap className="h-3 w-3 shrink-0 text-brand-light" />
              <span className="truncate">{sectorName ?? "-"}</span>
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
              className="flex flex-col items-center justify-center rounded-lg border border-panel-border bg-white/5 py-4 hover:border-brand"
            >
              <div className="relative flex h-16 w-16 items-center justify-center">
                <svg viewBox={`0 0 ${OEE_SIZE} ${OEE_SIZE}`} className="absolute inset-0 h-16 w-16 -rotate-90">
                  <circle
                    cx={OEE_SIZE / 2}
                    cy={OEE_SIZE / 2}
                    r={OEE_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={OEE_STROKE}
                    className="text-panel-border"
                  />
                  <circle
                    cx={OEE_SIZE / 2}
                    cy={OEE_SIZE / 2}
                    r={OEE_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={OEE_STROKE}
                    strokeLinecap="round"
                    className="text-brand"
                    strokeDasharray={OEE_CIRCUMFERENCE}
                    strokeDashoffset={OEE_CIRCUMFERENCE * (1 - animatedOee / 100)}
                  />
                </svg>
                <span className="text-sm font-bold text-slate-100">{Math.round(animatedOee)}%</span>
              </div>
              <p className="label-caps mt-2">OEE</p>
            </button>
          ) : (
            <button
              type="button"
              onClick={drilldown.open}
              className="flex h-full flex-col justify-between rounded-lg border border-panel-border bg-white/5 p-3 text-left hover:border-brand"
            >
              <div className="min-w-0">
                <p className="label-caps truncate">{top[0]?.label ?? "-"}</p>
                <p className="mt-1 truncate text-lg font-bold text-white">{top[0]?.value ?? "-"}</p>
              </div>
              <div className="mt-2 h-12 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={oeeHistoryData}>
                    <defs>
                      <linearGradient id={`oee-trend-${machine.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Tooltip cursor={false} content={() => null} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill={`url(#oee-trend-${machine.id})`}
                      isAnimationActive
                      animationDuration={900}
                      activeDot={{ r: 4, fill: "#60a5fa", stroke: "#0a1a2f", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </button>
          )}

          <div className="space-y-2">
            <div className="mb-1 flex items-center justify-between">
              <p className="label-caps">Variáveis</p>
              <button
                type="button"
                onClick={settingsDialog.open}
                className="text-muted hover:text-slate-200"
                aria-label={`Configurar variáveis de ${machine.name}`}
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
            {top.map((v) => {
              const Icon = variableIcon[v.key] ?? Tag;
              return (
                <div key={v.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-muted">
                    <Icon className="h-3 w-3 shrink-0 text-brand-light" />
                    {v.label}
                  </span>
                  <span className="font-semibold text-slate-200">{v.value}</span>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setComplementaresOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-light hover:bg-brand/10"
            >
              Complementares ({machine.customVariables.length})
            </button>

            {complementaresOpen && (
              <div className="rounded-lg border border-panel-border bg-white/5 p-3">
                {machine.customVariables.length === 0 ? (
                  <p className="text-xs text-muted">Sem variaveis complementares.</p>
                ) : (
                  <div className="space-y-2">
                    {machine.customVariables.map((v) => (
                      <div key={v.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted">{v.label}</span>
                        <span className="font-semibold text-slate-200">
                          {v.value}
                          {v.unit ? ` ${v.unit}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {bottom.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {bottom.map(({ display, visible }) =>
              visible ? (
                <div
                  key={display.key}
                  className="relative overflow-hidden rounded-lg border border-panel-border bg-white/5 p-3"
                >
                  <p className="label-caps">{display.label}</p>
                  <p className="mt-1 text-sm font-bold text-slate-100">{display.value}</p>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                    <div
                      className={cn(display.key === "production" ? "bg-success" : "bg-brand", "h-1")}
                      style={{ width: `${bottomBarPercent(machine, display.key)}%` }}
                    />
                  </div>
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
      <MachineFormDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.close}
        initial={machine}
        sectors={sectors}
        onSubmit={handleSaveEdit}
        isSubmitting={updateMutation.isPending}
      />
    </>
  );
}
