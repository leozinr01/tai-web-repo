import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as RadixDialog from "@radix-ui/react-dialog";
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  RefreshCw,
  Settings,
  PauseCircle,
  Gauge,
  XCircle,
  RotateCcw,
  Search,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { useSectors, useMachines } from "@/features/dashboard/queries";
import { useCreateAppointment } from "@/features/appointments/queries";
import { AppointmentFormDialog } from "@/features/appointments/components/appointment-form-dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { toast } from "@/hooks/use-toast";
import { repositories } from "@/data/repositories";
import type { AppointmentFormValues } from "@/domain/schemas/appointment.schema";
import type { Machine, MachineLossCategory } from "@/domain/entities/machine";

interface MachineDrilldownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine;
  onOpenSettings?: () => void;
}

type MetricKey = "availability" | "productivity" | "quality";

const metricLabels: Record<MetricKey, string> = {
  availability: "Disponibilidade",
  productivity: "Produtividade",
  quality: "Qualidade",
};

const metricPercentKey: Record<MetricKey, keyof Machine> = {
  availability: "availabilityPercent",
  productivity: "productivityPercent",
  quality: "qualityPercent",
};

const metricRingColor: Record<MetricKey, string> = {
  availability: "#3b4fe6",
  productivity: "#1bb58f",
  quality: "#2f6de2",
};

const categoryIcons: Record<string, typeof Activity> = {
  breakdown: Activity,
  setup: RefreshCw,
  idle: Settings,
  small_stops: PauseCircle,
  reduced_speed: Gauge,
  scrap: XCircle,
  rework: RotateCcw,
};

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function ProgressRing({
  percent,
  color,
  size,
  strokeWidth,
  textClassName,
}: {
  percent: number;
  color: string;
  size: number;
  strokeWidth: number;
  textClassName?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} fill="none" className="stroke-white/10" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={cn("absolute font-black text-white", textClassName)}>{clamped}%</span>
    </div>
  );
}

type Level =
  | { level: "root" }
  | { level: "metric"; metric: MetricKey }
  | { level: "category"; metric: MetricKey; category: MachineLossCategory };

export function MachineDrilldownDialog({ open, onOpenChange, machine, onOpenSettings }: MachineDrilldownDialogProps) {
  const [nav, setNav] = useState<Level>({ level: "root" });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const appointmentDialog = useDisclosure();

  const { user } = useAuth();
  const companyId = user?.companyId ?? "";
  const sectorsQuery = useSectors(companyId);
  const machinesQuery = useMachines(companyId, {});
  const usersQuery = useQuery({
    queryKey: ["users", companyId],
    queryFn: () => repositories.users.listByCompany(companyId),
  });
  const createAppointmentMutation = useCreateAppointment();

  const reset = () => setNav({ level: "root" });

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleCreateAppointment = async (values: AppointmentFormValues) => {
    try {
      await createAppointmentMutation.mutateAsync(values);
      toast({ title: "Apontamento criado com sucesso.", variant: "success" });
      appointmentDialog.close();
    } catch (err) {
      toast({
        title: "Nao foi possivel salvar o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <>
      {nav.level === "root" ? (
        <RadixDialog.Root open={open} onOpenChange={handleClose}>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
            <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[92vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto outline-none">
              <RadixDialog.Title className="sr-only">{machine.name}</RadixDialog.Title>
              <Card className="w-full p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="flex w-full flex-col gap-6 rounded-[2rem] border border-white/10 bg-navy-950/60 p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:p-10">
                    <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
                      <ProgressRing percent={machine.oeePercent} color="#21c1b3" size={160} strokeWidth={14} textClassName="text-2xl sm:text-4xl" />
                      <div className="flex flex-col items-center gap-1 sm:items-start">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Indicador OEE</span>
                        <p className="text-lg font-bold text-white">{machine.name}</p>
                      </div>
                    </div>
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={onOpenSettings}
                        aria-label={`Configurar variaveis de ${machine.name}`}
                        className="self-center rounded-2xl border border-white/10 bg-navy-950/70 p-3 text-[#21c1b3] transition-colors hover:bg-navy-950/90 sm:self-auto"
                      >
                        <Settings className="h-8 w-8" />
                      </button>
                    )}
                  </div>

                  <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                  {(["availability", "productivity", "quality"] as MetricKey[]).map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setNav({ level: "metric", metric })}
                      className="relative flex flex-col items-center rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/5 backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="w-full text-left">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{metricLabels[metric]}</span>
                      </div>
                      <div className="py-4">
                        <ProgressRing
                          percent={machine[metricPercentKey[metric]] as number}
                          color={metricRingColor[metric]}
                          size={100}
                          strokeWidth={8}
                          textClassName="text-2xl"
                        />
                      </div>
                      <ChevronRight className="absolute bottom-6 right-6 h-4 w-4 text-white/40" />
                    </button>
                  ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-white/30 transition-colors hover:text-white/60"
                  >
                    Clique fora para fechar
                  </button>
                </div>
              </Card>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      ) : (
        <Dialog
          open={open}
          onOpenChange={handleClose}
          title={nav.level === "metric" ? metricLabels[nav.metric] : nav.category.label}
          description={machine.name}
          size="sm"
        >
          {nav.level === "metric" && (
            <div className="space-y-3">
              {machine.lossBreakdown[nav.metric].map((category) => {
                const Icon = categoryIcons[category.key] ?? Activity;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setNav({ level: "category", metric: nav.metric, category })}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-panel-border bg-navy-800 p-4 text-left hover:border-brand"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-700 text-brand-light">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="label-caps">{category.label}</p>
                        <p className="text-sm font-bold text-slate-100">{formatHours(category.minutes)} hs</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </button>
                );
              })}

              <Button variant="secondary" className="w-full" onClick={() => setNav({ level: "root" })}>
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
            </div>
          )}

          {nav.level === "category" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label-caps mb-1.5 block">Data inicio</label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="label-caps mb-1.5 block">Data fim</label>
                  <div className="flex gap-2">
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="flex-1" />
                    <Button size="icon" variant="secondary" aria-label="Filtrar">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-panel-border bg-navy-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-700 text-brand-light">
                    {(() => {
                      const Icon = categoryIcons[nav.category.key] ?? Activity;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <p className="label-caps">{nav.category.label}</p>
                    <p className="text-sm font-bold text-slate-100">{formatHours(nav.category.minutes)} hs</p>
                  </div>
                </div>
                <Button size="sm" onClick={appointmentDialog.open}>
                  Apontamento
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setNav({ level: "metric", metric: nav.metric })}
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </Button>
            </div>
          )}
        </Dialog>
      )}

      <AppointmentFormDialog
        open={appointmentDialog.isOpen}
        onOpenChange={appointmentDialog.close}
        onSubmit={handleCreateAppointment}
        isSubmitting={createAppointmentMutation.isPending}
        sectors={sectorsQuery.data ?? []}
        machines={machinesQuery.data ?? []}
        users={usersQuery.data ?? []}
        prefill={{ sectorId: machine.sectorId, machineId: machine.id }}
      />
    </>
  );
}
