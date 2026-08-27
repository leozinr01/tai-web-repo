import { CircleCheck, Clock, TrendingUp, TriangleAlert } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkOrderStatus } from "@/domain/types/enums";
import { workOrderStatusLabels } from "@/lib/labels";
import type { WorkOrder } from "@/domain/entities/work-order";

const statusIcon: Record<WorkOrderStatus, typeof Clock> = {
  [WorkOrderStatus.LANCADA]: Clock,
  [WorkOrderStatus.ATRASADA]: TriangleAlert,
  [WorkOrderStatus.CONCLUIDA]: CircleCheck,
  [WorkOrderStatus.REALIZADA]: TrendingUp,
};

const statusColor: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.LANCADA]: "text-brand",
  [WorkOrderStatus.ATRASADA]: "text-danger",
  [WorkOrderStatus.CONCLUIDA]: "text-success",
  [WorkOrderStatus.REALIZADA]: "text-success",
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrder["status"] }) {
  const Icon = statusIcon[status];
  return (
    <span
      className={`flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor[status]}`}
    >
      <Icon className="h-3 w-3" />
      {workOrderStatusLabels[status]}
    </span>
  );
}

interface WorkOrderDetailsDialogProps {
  order: WorkOrder | null;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  machineName?: string;
  sectorName?: string;
}

export function WorkOrderDetailsDialog({ order, onOpenChange, onEdit, machineName, sectorName }: WorkOrderDetailsDialogProps) {
  const number = order?.number.replace(/^#/, "") ?? "";

  return (
    <Dialog
      open={!!order}
      onOpenChange={onOpenChange}
      title={number}
      description={order ? `Ordem de Serviço • ${machineName ?? "-"}` : undefined}
      size="sm"
      titleClassName="uppercase tracking-tight"
      descriptionClassName="text-xs font-medium"
      closeButtonClassName="rounded-xl border border-white/5 bg-white/5 p-2.5"
      footer={
        order && (
          <div className="flex gap-4 pt-2">
            <Button
              className="flex-1 rounded-2xl py-5 text-sm font-black uppercase shadow-xl shadow-brand/20 active:scale-95"
              onClick={onEdit}
            >
              Editar O.S.
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
      {order && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
            <div>
              <p className="label-caps">Status atual</p>
              <div className="mt-1">
                <WorkOrderStatusBadge status={order.status} />
              </div>
            </div>
            <div className="text-right">
              <p className="label-caps">Número da O.S.</p>
              <p className="text-xl font-black text-white">#{number}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="label-caps mb-1">Equipamento</p>
              <p className="text-sm font-bold text-white">{machineName ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="label-caps mb-1">Setor</p>
              <p className="text-sm font-bold text-white">{sectorName ?? "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="label-caps mb-1">Responsável / Executor</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-xs font-bold text-white">
                {order.executorName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-white">{order.executorName}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <p className="label-caps mb-1">Serviço solicitado</p>
            <p className="mt-1.5 rounded-xl bg-navy-950/40 p-3 text-sm text-white">{order.description}</p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
