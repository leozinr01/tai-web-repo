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

export const AppointmentArea = {
  MECANICA: "mechanical",
  ELETRICA: "electrical",
  OPERACIONAL: "operational",
  QUALIDADE: "quality",
  OUTRO: "other",
} as const;
export type AppointmentArea = (typeof AppointmentArea)[keyof typeof AppointmentArea];
