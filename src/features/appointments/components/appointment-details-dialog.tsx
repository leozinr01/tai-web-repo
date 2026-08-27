import { format, parseISO } from "date-fns";
import { Clock } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/domain/entities/appointment";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface AppointmentDetailsDialogProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  machineName?: string;
  sectorName?: string;
}

export function AppointmentDetailsDialog({
  appointment,
  onOpenChange,
  onEdit,
  machineName,
  sectorName,
}: AppointmentDetailsDialogProps) {
  return (
    <Dialog
      open={!!appointment}
      onOpenChange={onOpenChange}
      title="Detalhes do apontamento"
      description={appointment ? `Registro operacional • ${format(parseISO(appointment.date), "dd/MM/yyyy")}` : undefined}
      size="sm"
      titleClassName="uppercase tracking-tight"
      descriptionClassName="text-xs font-medium"
      closeButtonClassName="rounded-xl border border-white/5 bg-white/5 p-2.5"
      footer={
        appointment && (
          <div className="flex gap-4 pt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-2xl border-brand/40 bg-white/5 py-5 text-sm font-black uppercase text-brand-light active:scale-95"
              onClick={onEdit}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 rounded-2xl border-white/10 bg-white/5 py-5 text-sm font-black uppercase active:scale-95"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        )
      }
    >
      {appointment && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="label-caps">Data / Hora</p>
              <p className="mt-1 text-sm font-bold text-white">
                {format(parseISO(appointment.date), "dd/MM/yyyy")} às {appointment.time}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="label-caps">Duração</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-white">
                <Clock className="h-3.5 w-3.5 text-brand" />
                {formatDuration(appointment.durationMinutes)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="label-caps">Equipamento</p>
            <p className="mt-1 text-sm font-bold text-white">{machineName ?? "-"}</p>
            <p className="label-caps mt-0.5">{sectorName ?? "-"}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="label-caps">Lançador</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/20 text-xs font-bold text-brand">
                {appointment.authorName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-white">{appointment.authorName}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="label-caps">Descrição do apontamento</p>
            <p className="mt-1.5 text-sm italic text-slate-300">&ldquo;{appointment.description}&rdquo;</p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
