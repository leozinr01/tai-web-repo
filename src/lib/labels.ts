import { AppointmentArea, MachineStatus, UserRole, WorkOrderPeriodicity, WorkOrderStatus } from "@/domain/types/enums";

export const machineStatusLabels: Record<MachineStatus, string> = {
  [MachineStatus.PRODUZINDO]: "Produzindo",
  [MachineStatus.PARADO]: "Parado",
  [MachineStatus.EMERGENCIA]: "Emergência",
};

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.LANCADA]: "Lançado",
  [WorkOrderStatus.REALIZADA]: "Realizado",
  [WorkOrderStatus.CONCLUIDA]: "Concluído",
  [WorkOrderStatus.ATRASADA]: "Atrasado",
};

export const workOrderPeriodicityLabels: Record<WorkOrderPeriodicity, string> = {
  [WorkOrderPeriodicity.DIARIA]: "Diária",
  [WorkOrderPeriodicity.SEMANAL]: "Semanal",
  [WorkOrderPeriodicity.MENSAL]: "Mensal",
  [WorkOrderPeriodicity.TRIMESTRAL]: "Trimestral",
  [WorkOrderPeriodicity.SEMESTRAL]: "Semestral",
  [WorkOrderPeriodicity.ANUAL]: "Anual",
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
