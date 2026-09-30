/**
 * Enumeracoes de dominio. Independentes de React/navegador.
 * Compartilhaveis com o futuro app React Native.
 */

export const UserRole = {
  MASTER: "master",
  ADMIN: "admin",
  OPERATOR: "operator",
  VIEWER: "viewer",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const MachineStatus = {
  PRODUZINDO: "producing",
  PARADO: "stopped",
  EMERGENCIA: "emergency",
} as const;
export type MachineStatus = (typeof MachineStatus)[keyof typeof MachineStatus];

export const WorkOrderStatus = {
  LANCADA: "issued",
  REALIZADA: "done",
  CONCLUIDA: "completed",
  ATRASADA: "delayed",
} as const;
export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

export const WorkOrderPeriodicity = {
  DIARIA: "daily",
  SEMANAL: "weekly",
  QUINZENAL: "biweekly",
  MENSAL: "monthly",
  TRIMESTRAL: "quarterly",
  SEMESTRAL: "semiannual",
  ANUAL: "annual",
} as const;
export type WorkOrderPeriodicity = (typeof WorkOrderPeriodicity)[keyof typeof WorkOrderPeriodicity];

export const CompanyStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

/** Pilar do OEE afetado pelo apontamento. Os valores sao gravados como estao na coluna `OEE` de `Apontamentos`. */
export const AppointmentArea = {
  DISPONIBILIDADE: "Disponibilidade",
  PRODUTIVIDADE: "Produtividade",
  QUALIDADE: "Qualidade",
} as const;
export type AppointmentArea = (typeof AppointmentArea)[keyof typeof AppointmentArea];

/**
 * Seguimento afetado, gravado como esta na coluna `seguimento_OEE` de `Apontamentos`.
 * A grafia (maiusculas, acentos) precisa ser identica a do sistema antigo, que usa o mesmo banco:
 * qualquer diferenca vira outra categoria para ele e para os relatorios.
 */
export const AffectedSegment = {
  QUEBRAS_FALHAS: "Quebras e falhas",
  SETUP: "Setup",
  OCIOSIDADE: "Ociosidade",
  PEQUENAS_FALHAS: "Pequenas falhas",
  QUEDA_VELOCIDADE: "Queda de velocidade",
  DEFEITO_MATERIA_PRIMA: "Defeito matéria prima",
  PRODUTO_NAO_CONFORME: "Produto não conforme",
  REFUGO: "Refugo",
  RETRABALHO: "Retrabalho",
} as const;
export type AffectedSegment = (typeof AffectedSegment)[keyof typeof AffectedSegment];
