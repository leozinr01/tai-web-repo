import { AppointmentArea, MachineStatus, UserRole, WorkOrderStatus } from "@/domain/types/enums";

export const machineStatusLabels: Record<MachineStatus, string> = {
  [MachineStatus.PRODUZINDO]: "Produzindo",
  [MachineStatus.PARADO]: "Parado",
  [MachineStatus.EMERGENCIA]: "Emergência",
};

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.LANCADA]: "Lançada",
  [WorkOrderStatus.EM_ANDAMENTO]: "Em andamento",
  [WorkOrderStatus.CONCLUIDA]: "Concluída",
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
  [AppointmentArea.MECANICA]: "Mecânica",
  [AppointmentArea.ELETRICA]: "Elétrica",
  [AppointmentArea.OPERACIONAL]: "Operacional",
  [AppointmentArea.QUALIDADE]: "Qualidade",
  [AppointmentArea.OUTRO]: "Outro",
};

export const affectedSegmentOptions = [
  "Produção",
  "Manutenção",
  "Qualidade",
  "Logística",
  "Segurança",
];
