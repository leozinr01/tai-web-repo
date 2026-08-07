import { AppointmentArea, MachineStatus, UserRole, WorkOrderStatus } from "@/domain/types/enums";

export const machineStatusLabels: Record<MachineStatus, string> = {
  [MachineStatus.PRODUZINDO]: "Produzindo",
  [MachineStatus.PARADO]: "Parado",
  [MachineStatus.EMERGENCIA]: "Emergencia",
};

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.LANCADA]: "Lancada",
  [WorkOrderStatus.EM_ANDAMENTO]: "Em andamento",
  [WorkOrderStatus.CONCLUIDA]: "Concluida",
  [WorkOrderStatus.ATRASADA]: "Atrasada",
  [WorkOrderStatus.CANCELADA]: "Cancelada",
};

export const userRoleLabels: Record<UserRole, string> = {
  [UserRole.MASTER]: "Master",
  [UserRole.ADMIN]: "Administrador",
  [UserRole.OPERATOR]: "Operador",
  [UserRole.VIEWER]: "Visitante",
};

export const appointmentAreaLabels: Record<AppointmentArea, string> = {
  [AppointmentArea.MECANICA]: "Mecanica",
  [AppointmentArea.ELETRICA]: "Eletrica",
  [AppointmentArea.OPERACIONAL]: "Operacional",
  [AppointmentArea.QUALIDADE]: "Qualidade",
  [AppointmentArea.OUTRO]: "Outro",
};

export const affectedSegmentOptions = [
  "Producao",
  "Manutencao",
  "Qualidade",
  "Logistica",
  "Seguranca",
];
