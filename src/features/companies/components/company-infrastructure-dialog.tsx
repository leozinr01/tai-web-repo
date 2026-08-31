import { useState } from "react";
import { Building2, LayoutDashboard, Zap, Plus, Pen, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDisclosure } from "@/hooks/use-disclosure";
import { toast } from "@/hooks/use-toast";
import { useSectors, useMachines, useUpdateMachine } from "@/features/dashboard/queries";
import {
  useCreateSector,
  useUpdateSector,
  useDeleteSector,
  useCreateMachine,
  useDeleteMachine,
} from "@/features/companies/queries";
import { SectorFormDialog } from "@/features/companies/components/sector-form-dialog";
import { MachineFormDialog } from "@/features/companies/components/machine-form-dialog";
import type { Company } from "@/domain/entities/company";
import type { Sector } from "@/domain/entities/sector";
import type { Machine, MachineCustomVariable } from "@/domain/entities/machine";

export function CompanyInfrastructureDialog({
  company,
  onOpenChange,
}: {
  company: Company | null;
  onOpenChange: (open: boolean) => void;
}) {
  const companyId = company?.id ?? "";
  const sectorsQuery = useSectors(companyId);
  const machinesQuery = useMachines(companyId, {});

  const createSector = useCreateSector();
  const updateSector = useUpdateSector();
  const deleteSector = useDeleteSector();
  const createMachine = useCreateMachine();
  const updateMachine = useUpdateMachine();
  const deleteMachine = useDeleteMachine();

  const sectorDialog = useDisclosure();
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const deleteSectorDialog = useDisclosure();
  const [sectorToDelete, setSectorToDelete] = useState<Sector | null>(null);

  const machineDialog = useDisclosure();
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const deleteMachineDialog = useDisclosure();
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);

  const sectors = sectorsQuery.data ?? [];
  const machines = machinesQuery.data ?? [];
  const sectorNameById = new Map(sectors.map((s) => [s.id, s.name]));

  const openCreateSector = () => {
    setEditingSector(null);
    sectorDialog.open();
  };
  const openEditSector = (sector: Sector) => {
    setEditingSector(sector);
    sectorDialog.open();
  };
  const handleSectorSubmit = async (values: { name: string }) => {
    try {
      if (editingSector) {
        await updateSector.mutateAsync({ id: editingSector.id, name: values.name });
        toast({ title: "Setor atualizado.", variant: "success" });
      } else {
        await createSector.mutateAsync({ companyId, name: values.name });
        toast({ title: "Setor cadastrado.", variant: "success" });
      }
      sectorDialog.close();
    } catch (err) {
      toast({ title: "Não foi possível salvar o setor.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };
  const handleDeleteSector = async () => {
    if (!sectorToDelete) return;
    try {
      await deleteSector.mutateAsync({ id: sectorToDelete.id, companyId });
      toast({ title: "Setor excluído.", variant: "success" });
      deleteSectorDialog.close();
    } catch (err) {
      toast({ title: "Não foi possível excluir o setor.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  const openCreateMachine = () => {
    setEditingMachine(null);
    machineDialog.open();
  };
  const openEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    machineDialog.open();
  };
  const handleMachineSubmit = async (values: {
    name: string;
    sectorId: string;
    customVariables: MachineCustomVariable[];
  }) => {
    try {
      if (editingMachine) {
        await updateMachine.mutateAsync({
          id: editingMachine.id,
          data: { name: values.name, sectorId: values.sectorId, customVariables: values.customVariables },
        });
        toast({ title: "Máquina atualizada.", variant: "success" });
      } else {
        const created = await createMachine.mutateAsync({
          companyId,
          sectorId: values.sectorId,
          name: values.name,
        });
        if (values.customVariables.length > 0) {
          await updateMachine.mutateAsync({ id: created.id, data: { customVariables: values.customVariables } });
        }
        toast({ title: "Máquina cadastrada.", variant: "success" });
      }
      machineDialog.close();
    } catch (err) {
      toast({ title: "Não foi possível salvar a máquina.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };
  const handleDeleteMachine = async () => {
    if (!machineToDelete) return;
    try {
      await deleteMachine.mutateAsync({ id: machineToDelete.id, companyId });
      toast({ title: "Máquina excluída.", variant: "success" });
      deleteMachineDialog.close();
    } catch (err) {
      toast({ title: "Não foi possível excluir a máquina.", description: err instanceof Error ? err.message : undefined, variant: "error" });
    }
  };

  return (
    <>
      <Dialog
        open={!!company}
        onOpenChange={onOpenChange}
        title="Gerenciar infraestrutura"
        titleClassName="uppercase tracking-tight"
        description={company?.name}
        descriptionClassName="text-xs font-bold uppercase tracking-widest text-muted"
        icon={<Building2 className="h-5 w-5" />}
        size="xl"
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight text-white">
                <LayoutDashboard className="h-4 w-4 text-brand-light" /> Setores
              </p>
              <button
                onClick={openCreateSector}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[10px] font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
              >
                <Plus className="h-3.5 w-3.5" /> ADICIONAR
              </button>
            </div>
            <div className="space-y-3">
              {sectors.length === 0 && (
                <p className="text-xs italic text-muted">Nenhum setor cadastrado.</p>
              )}
              {sectors.map((sector) => (
                <div
                  key={sector.id}
                  className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-brand/50 hover:bg-white/[0.05]"
                >
                  <span className="text-sm font-bold text-white">{sector.name}</span>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEditSector(sector)}
                      className="rounded-lg bg-white/5 p-2 text-muted hover:bg-brand/10 hover:text-brand-light"
                      aria-label={`Editar ${sector.name}`}
                    >
                      <Pen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setSectorToDelete(sector); deleteSectorDialog.open(); }}
                      className="rounded-lg bg-white/5 p-2 text-muted hover:bg-danger/10 hover:text-danger-light"
                      aria-label={`Excluir ${sector.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight text-white">
                <Zap className="h-4 w-4 text-brand-light" /> Máquinas
              </p>
              <button
                onClick={openCreateMachine}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[10px] font-black text-white shadow-lg shadow-brand/20 hover:bg-brand-hover"
              >
                <Plus className="h-3.5 w-3.5" /> ADICIONAR
              </button>
            </div>
            <div className="space-y-3">
              {machines.length === 0 && (
                <p className="text-xs italic text-muted">Nenhuma máquina cadastrada.</p>
              )}
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 transition-all hover:border-brand/50 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{machine.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      {sectorNameById.get(machine.sectorId) ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEditMachine(machine)}
                      className="rounded-lg bg-white/5 p-2 text-muted hover:bg-brand/10 hover:text-brand-light"
                      aria-label={`Editar ${machine.name}`}
                    >
                      <Pen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setMachineToDelete(machine); deleteMachineDialog.open(); }}
                      className="rounded-lg bg-white/5 p-2 text-muted hover:bg-danger/10 hover:text-danger-light"
                      aria-label={`Excluir ${machine.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <SectorFormDialog
        open={sectorDialog.isOpen}
        onOpenChange={sectorDialog.close}
        onSubmit={handleSectorSubmit}
        isSubmitting={createSector.isPending || updateSector.isPending}
        initial={editingSector}
      />
      <ConfirmDialog
        open={deleteSectorDialog.isOpen}
        onOpenChange={deleteSectorDialog.close}
        title="Excluir setor"
        description={`Tem certeza que deseja excluir o setor "${sectorToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteSector}
        isLoading={deleteSector.isPending}
        confirmLabel="Excluir"
      />

      <MachineFormDialog
        open={machineDialog.isOpen}
        onOpenChange={machineDialog.close}
        onSubmit={handleMachineSubmit}
        isSubmitting={createMachine.isPending || updateMachine.isPending}
        initial={editingMachine}
        sectors={sectors}
      />
      <ConfirmDialog
        open={deleteMachineDialog.isOpen}
        onOpenChange={deleteMachineDialog.close}
        title="Excluir máquina"
        description={`Tem certeza que deseja excluir a máquina "${machineToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDeleteMachine}
        isLoading={deleteMachine.isPending}
        confirmLabel="Excluir"
      />
    </>
  );
}
