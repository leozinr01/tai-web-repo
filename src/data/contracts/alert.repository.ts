import type { AlertChannel, AlertContact, AlertEvent, AlertLevel, AlertRule } from "@/domain/entities/alert";
import type { PagedResult } from "@/data/contracts/appointment.repository";

export interface AlertRuleUpdate {
  min: number | null;
  max: number | null;
  timeoutMinutes: number;
  level: AlertLevel;
}

export interface AlertContactInput {
  name: string;
  phone: string;
  channel: AlertChannel;
}

export interface AlertRepository {
  /** Variaveis das maquinas da empresa, com seus limites de alerta. */
  listRules(companyId: string): Promise<AlertRule[]>;
  /** Grava os limites e zera o estado do alerta (a contagem recomeca com a regra nova). */
  updateRule(variableId: string, data: AlertRuleUpdate): Promise<void>;
  listContacts(companyId: string): Promise<AlertContact[]>;
  createContact(companyId: string, data: AlertContactInput): Promise<AlertContact>;
  updateContact(id: string, data: AlertContactInput): Promise<AlertContact>;
  removeContact(id: string): Promise<void>;
  /** Alertas disparados para as variaveis da empresa, mais recentes primeiro. */
  listEvents(companyId: string, page: number, pageSize: number): Promise<PagedResult<AlertEvent>>;
}
