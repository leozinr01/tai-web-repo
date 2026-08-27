import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as RadixDialog from "@radix-ui/react-dialog";
import {
  ChevronRight,
  ChevronLeft,
  Activity,
  RefreshCw,
  Settings,
  Gauge,
  Layers,
  Grid3x3,
  Ellipsis,
  Hand,
  Search,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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

const CATEGORY_COLORS = ["#eab308", "#3b82f6", "#a855f7"];

const categoryIcons: Record<string, typeof Activity> = {
  breakdown: Activity,
  setup: RefreshCw,
  idle: Settings,
  small_stops: Activity,
  reduced_speed: Gauge,
  raw_material_defect: Layers,
  non_conforming_product: Grid3x3,
  scrap: Ellipsis,
  rework: Hand,
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
        title: "Não foi possível salvar o apontamento.",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <>
      {nav.level === "root" ? (
        <RadixDialog.Root open={open && !appointmentDialog.isOpen} onOpenChange={handleClose}>
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
                        aria-label={`Configurar variáveis de ${machine.name}`}
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
        <RadixDialog.Root open={open && !appointmentDialog.isOpen} onOpenChange={handleClose}>
          <RadixDialog.Portal>
            <RadixDialog.Overlay className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
            <RadixDialog.Content
              className={cn(
                "fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto outline-none",
                nav.level === "category" ? "max-w-4xl" : "max-w-lg",
              )}
            >
              <RadixDialog.Title className="sr-only">
                {nav.level === "metric" ? metricLabels[nav.metric] : nav.category.label}
              </RadixDialog.Title>
              <Card className="w-full p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="h-1 w-10 rounded-full bg-white/10" />

                  {nav.level === "metric" && (
                    <>
                      <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white">
                          {metricLabels[nav.metric]}
                        </h2>
                        <p className="text-sm font-bold text-muted">{machine.name}</p>
                      </div>

                      <div className="flex w-full flex-col gap-4">
                        {machine.lossBreakdown[nav.metric].map((category, index) => {
                          const Icon = categoryIcons[category.key] ?? Activity;
                          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                          return (
                            <button
                              key={category.key}
                              type="button"
                              onClick={() => setNav({ level: "category", metric: nav.metric, category })}
                              className="group flex w-full items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/5 ring-1 ring-white/10 backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              <div className="flex items-center gap-6">
                                <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm">
                                  <Icon className="h-8 w-8" style={{ color }} />
                                </div>
                                <div className="flex flex-col items-start">
                                  <span className="text-sm font-black uppercase tracking-tight text-white/80">
                                    {category.label}
                                  </span>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-2xl font-black text-white">
                                      {formatHours(category.minutes)} hs
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-white/20 transition-colors group-hover:text-white/40" />
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setNav({ level: "root" })}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-navy-950/60 py-4 text-sm font-black uppercase text-white transition-all hover:bg-navy-950/80"
                      >
                        <ChevronLeft className="h-4 w-4" /> Voltar
                      </button>
                    </>
                  )}

                  {nav.level === "category" && (
                    <>
                      <div className="flex w-full items-end gap-3">
                        <div className="group relative flex-1">
                          <label className="absolute -top-2 left-3 z-10 bg-navy-950 px-1 text-[10px] uppercase tracking-wider text-muted">
                            Data inicio
                          </label>
                          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-all group-focus-within:border-brand group-focus-within:ring-1 group-focus-within:ring-brand">
                            <Calendar className="h-4 w-4 shrink-0 text-muted" />
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-white focus:outline-none [color-scheme:dark]"
                            />
                          </div>
                        </div>
                        <div className="group relative flex-1">
                          <label className="absolute -top-2 left-3 z-10 bg-navy-950 px-1 text-[10px] uppercase tracking-wider text-muted">
                            Data fim
                          </label>
                          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition-all group-focus-within:border-brand group-focus-within:ring-1 group-focus-within:ring-brand">
                            <Calendar className="h-4 w-4 shrink-0 text-muted" />
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full bg-transparent text-sm font-bold text-white focus:outline-none [color-scheme:dark]"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="Filtrar"
                          className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 text-muted transition-colors hover:text-white"
                        >
                          <Search className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="w-full rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
                        <h3 className="text-2xl font-black uppercase tracking-tight text-white/85 sm:text-3xl">
                          {nav.category.label}
                        </h3>
                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                              {(() => {
                                const Icon = categoryIcons[nav.category.key] ?? Activity;
                                return <Icon className="h-6 w-6 text-white/70" />;
                              })()}
                            </div>
                            <span className="text-2xl font-black text-white sm:text-4xl">
                              {formatHours(nav.category.minutes)} hs
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={appointmentDialog.open}
                            className="rounded-xl bg-brand px-6 py-3 text-sm font-black text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-hover"
                          >
                            Apontamento
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setNav({ level: "metric", metric: nav.metric })}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-navy-950/60 py-4 text-sm font-black uppercase text-white transition-all hover:bg-navy-950/80"
                      >
                        <ChevronLeft className="h-4 w-4" /> Voltar
                      </button>
                    </>
                  )}
                </div>
              </Card>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        </RadixDialog.Root>
      )}

      <AppointmentFormDialog
        open={appointmentDialog.isOpen}
        onOpenChange={appointmentDialog.close}
        onSubmit={handleCreateAppointment}
        isSubmitting={createAppointmentMutation.isPending}
        companyId={companyId}
        sectors={sectorsQuery.data ?? []}
        machines={machinesQuery.data ?? []}
        users={usersQuery.data ?? []}
        prefill={{ sectorId: machine.sectorId, machineId: machine.id }}
      />
    </>
  );
}
