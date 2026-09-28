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
  [WorkOrderPeriodicity.QUINZENAL]: "Quinzenal",
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
  [AppointmentArea.DISPONIBILIDADE]: "Disponibilidade",
  [AppointmentArea.PRODUTIVIDADE]: "Produtividade",
  [AppointmentArea.QUALIDADE]: "Qualidade",
};

/**
 * Seguimentos de cada pilar do OEE, gravados como texto em `Apontamentos.seguimento_OEE`.
 * Mesmos nomes das categorias de perda do detalhe da maquina (`toLossBreakdown`).
 */
export const affectedSegmentsByArea: Record<AppointmentArea, string[]> = {
  [AppointmentArea.DISPONIBILIDADE]: ["Quebra / Falhas", "Setup", "Ociosidade"],
  [AppointmentArea.PRODUTIVIDADE]: ["Pequenas Falhas", "Queda de Velocidade", "Defeito Matéria Prima"],
  [AppointmentArea.QUALIDADE]: ["Produto não Conforme", "Refugo", "Retrabalho"],
};
