import { initials } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import type { Company } from "@/domain/entities/company";
import type { Sector } from "@/domain/entities/sector";
import type { Machine, MachineVariables } from "@/domain/entities/machine";
import type { User } from "@/domain/entities/user";
import type { Appointment } from "@/domain/entities/appointment";
import type { WorkOrder } from "@/domain/entities/work-order";
import type { ReportRow } from "@/domain/entities/report";
import {
  AppointmentArea,
  CompanyStatus,
  MachineStatus,
  UserRole,
  UserStatus,
  WorkOrderStatus,
} from "@/domain/types/enums";

/**
 * Camada de traducao entre o schema legado (portugues, usado hoje em producao
 * pelo app mobile) e o dominio em ingles do tai-web. Nenhuma tabela nova foi
 * criada — cada mapper "traduz" nomes e valores de colunas existentes.
 */

// ---------------------------------------------------------------------------
// Company <-> Empresas
// ---------------------------------------------------------------------------

export function mapCompanyRow(
  row: Tables<"Empresas">,
  counts?: { sectorsCount?: number; machinesCount?: number },
): Company {
  return {
    id: row.idEmpresa ?? String(row.id),
    name: row.nome ?? "",
    email: row.responsavel ?? "",
    logoUrl: row.logo_url ?? undefined,
    status: CompanyStatus.ACTIVE, // "Empresas" nao tem coluna de status hoje
    sectorsCount: counts?.sectorsCount ?? 0,
    machinesCount: counts?.machinesCount ?? 0,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Sector <-> Sala
// ---------------------------------------------------------------------------

export function mapSectorRow(row: Tables<"Sala">, companyId: string): Sector {
  return {
    id: row.sala,
    companyId,
    name: row.sala,
  };
}

// ---------------------------------------------------------------------------
// Machine <-> Maquinas
// ---------------------------------------------------------------------------

export function mapMachineStatus(row: Tables<"Maquinas">): Machine["status"] {
  if (row.emergencia) return MachineStatus.EMERGENCIA;
  if (row.parado) return MachineStatus.PARADO;
  return MachineStatus.PRODUZINDO;
}

export function mapMachineRow(row: Tables<"Maquinas">, companyId: string): Machine {
  const variables: MachineVariables = {
    horimeterHours: row.horimetro ?? 0,
    vibrationMm: row.Vibração ?? 0,
    temperatureC: row.Temperatura ?? 0,
    speed: row.VelocidadeAtual ?? 0,
    speedUnit: "",
    productionAmount: row.ProdAtual ?? 0,
    productionUnit: row.unidProducao ?? "",
  };
  return {
    id: String(row.id),
    companyId,
    sectorId: row.IDsala,
    name: row.maquina ?? "",
    code: String(row.id),
    status: mapMachineStatus(row),
    oeePercent: (row.OEE ?? 0) * 100,
    availabilityPercent: (row.OEE_disponibilidade ?? 0) * 100,
    productivityPercent: (row.OEE_produtividade ?? 0) * 100,
    qualityPercent: (row.OEE_qualidade ?? 0) * 100,
    variables,
    complementaryCount: 0,
    oeeHistory: [],
  };
}

// ---------------------------------------------------------------------------
// User <-> User (+ auth.users)
// ---------------------------------------------------------------------------

const TIPO_TO_ROLE: Record<string, User["role"]> = {
  Master: UserRole.MASTER,
  Admin: UserRole.ADMIN,
  Operator: UserRole.OPERATOR,
  Cliente: UserRole.VIEWER,
  Vendedor: UserRole.VIEWER,
};

export function mapUserRole(tipo: string | null): User["role"] {
  if (!tipo) return UserRole.VIEWER;
  return TIPO_TO_ROLE[tipo] ?? UserRole.VIEWER;
}

const ROLE_TO_TIPO: Record<User["role"], string> = {
  [UserRole.MASTER]: "Master",
  [UserRole.ADMIN]: "Admin",
  [UserRole.OPERATOR]: "Operator",
  [UserRole.VIEWER]: "Cliente",
};

export function mapRoleToTipo(role: User["role"]): string {
  return ROLE_TO_TIPO[role];
}

export function mapUserStatus(status: string | null): User["status"] {
  // Maioria das linhas legadas tem Status = "" (nunca preenchido) e ainda
  // assim sao contas em uso — so tratamos como inativo quando dito
  // explicitamente.
  return status?.toLowerCase() === "inativo" ? UserStatus.INACTIVE : UserStatus.ACTIVE;
}

export function mapStatusToDb(status: User["status"]): string {
  return status === UserStatus.INACTIVE ? "inativo" : "ativo";
}

export function mapUserRow(row: Tables<"User">): User {
  const name = row.nomeUser ?? row.nomeE ?? "";
  return {
    id: row.idRef ?? String(row.id),
    companyId: row.idEmpresa ?? "",
    name,
    email: row.email ?? "",
    role: mapUserRole(row.tipo),
    status: mapUserStatus(row.Status),
    avatarInitials: initials(name || row.email || "?"),
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Appointment <-> Apontamentos
// ---------------------------------------------------------------------------

/**
 * "Apontamentos" nao tem coluna de "area" (Mecanica/Eletrica/Operacional/
 * Qualidade/Outro) — essa classificacao nao existe no schema legado. As
 * colunas mais proximas sao "seguimento_OEE" (motivo da perda, ex. "Quebra
 * de Maquina", "Setup", "Refugo" — mapeado para affectedSegment) e "OEE"
 * (pilar afetado: Disponibilidade/Produtividade/Qualidade), nenhuma das duas
 * equivalente a area. Ate existir uma coluna real, sempre retornamos OUTRO.
 */
export function mapAppointmentArea(): Appointment["area"] {
  return AppointmentArea.OUTRO;
}

/** "data_lancamento" vem como texto BR "D/M/AAAA" (dia/mes sem zero a esquerda
 * as vezes, ex. "29/8/2025") — nao ISO como o restante do dominio assume. */
function parseBrDateToIso(value: string | null): string {
  if (!value) return "";
  const [d, m, y] = value.split("/");
  if (!d || !m || !y) return value;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function isoDateToBr(value: string): string {
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

/** "tempo_parada" vem como texto "HH:MM" (duracao), nao um numero de minutos. */
function parseHhMmToMinutes(value: string | null): number {
  if (!value) return 0;
  const [h, m] = value.split(":");
  const hours = Number(h);
  const minutes = Number(m);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function minutesToHhMm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function mapAppointmentRow(
  row: Tables<"Apontamentos">,
  companyId: string,
  nameToId?: Map<string, string>,
): Appointment {
  return {
    id: String(row.id),
    companyId,
    sectorId: row.Setor ?? "",
    machineId: (row.idMaquina && nameToId?.get(row.idMaquina)) ?? row.idMaquina ?? "",
    area: mapAppointmentArea(),
    affectedSegment: row.seguimento_OEE ?? "",
    date: parseBrDateToIso(row.data_lancamento),
    time: (row.hora_lancamento ?? "").slice(0, 5),
    durationMinutes: parseHhMmToMinutes(row.tempo_parada),
    authorId: "",
    authorName: row.lançador ?? "",
    description: row.apontamento ?? "",
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// WorkOrder <-> "Ordem de servico"
// ---------------------------------------------------------------------------

const STATUS_TO_DB: Record<WorkOrder["status"], string> = {
  [WorkOrderStatus.LANCADA]: "Lançado",
  [WorkOrderStatus.EM_ANDAMENTO]: "Em andamento",
  [WorkOrderStatus.CONCLUIDA]: "Concluído",
  [WorkOrderStatus.ATRASADA]: "Atrasado",
  [WorkOrderStatus.CANCELADA]: "Cancelado",
};

const DB_TO_STATUS: Record<string, WorkOrder["status"]> = {
  Lançado: WorkOrderStatus.LANCADA,
  "Em andamento": WorkOrderStatus.EM_ANDAMENTO,
  Concluído: WorkOrderStatus.CONCLUIDA,
  Realizado: WorkOrderStatus.CONCLUIDA,
  Atrasado: WorkOrderStatus.ATRASADA,
  Cancelado: WorkOrderStatus.CANCELADA,
};

export function mapWorkOrderStatus(raw: string | null): WorkOrder["status"] {
  if (!raw) return WorkOrderStatus.LANCADA;
  return DB_TO_STATUS[raw] ?? WorkOrderStatus.LANCADA;
}

export function mapWorkOrderStatusToDb(status: WorkOrder["status"]): string {
  return STATUS_TO_DB[status];
}

const STATUS_TO_DB_LIST: Record<WorkOrder["status"], string[]> = {
  [WorkOrderStatus.LANCADA]: ["Lançado"],
  [WorkOrderStatus.EM_ANDAMENTO]: ["Em andamento"],
  [WorkOrderStatus.CONCLUIDA]: ["Concluído", "Realizado"],
  [WorkOrderStatus.ATRASADA]: ["Atrasado"],
  [WorkOrderStatus.CANCELADA]: ["Cancelado"],
};

/** Um status do dominio pode corresponder a mais de um texto no banco legado
 * (ex.: "Concluído" e "Realizado" sao ambos concluidos) — usar em filtros
 * (.in(...)) em vez de igualdade direta. */
export function mapWorkOrderStatusToDbList(status: WorkOrder["status"]): string[] {
  return STATUS_TO_DB_LIST[status];
}

/**
 * "Ordem de servico".idMaquina guarda o NOME da maquina (texto livre, ex.
 * "COMPRESSOR 2"), nao o id numerico de "Maquinas". nameToId resolve nome ->
 * id quando disponivel; sem ele, cai de volta para o nome (comportamento
 * anterior) para nao quebrar chamadores que ainda nao passam o mapa.
 */
export function mapWorkOrderRow(
  row: Tables<"Ordem de serviço">,
  companyId: string,
  nameToId?: Map<string, string>,
): WorkOrder {
  return {
    id: String(row.id),
    companyId,
    number: row.numOrdem != null ? `#${row.numOrdem}` : `#${row.id}`,
    machineId: nameToId?.get(row.idMaquina) ?? row.idMaquina,
    sectorId: row.setor ?? "",
    executorId: "",
    executorName: row.Executor ?? "",
    description: row.servico ?? "",
    date: row.data ?? "",
    status: mapWorkOrderStatus(row.status),
    createdAt: row.created_at,
    updatedAt: row["data execucao"] ?? row.created_at,
  };
}

// ---------------------------------------------------------------------------
// ReportRow <-> Relatorio
// ---------------------------------------------------------------------------

/**
 * "Relatório".variables nao tem chaves fixas — sao variaveis livres por tipo
 * de maquina, com unidade embutida no proprio nome (ex. "Horímetro (h)",
 * "Pureza da Geração (%)", "Vazão de Consumo (Nm³/h)"). Casamos por padrao no
 * nome da chave em vez de esperar chaves camelCase fixas que nao existem nos
 * dados reais. Chaves nao reconhecidas entram em additionalVariablesCount.
 */
const VARIABLE_KEY_PATTERNS: Record<"horimeterHours" | "vibrationMax" | "temperatureMax", RegExp> = {
  horimeterHours: /hor[íi]metro/i,
  vibrationMax: /vibra/i,
  temperatureMax: /temperatura/i,
};

function parseVariableNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value.replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function pickVariable(vars: Record<string, unknown>, pattern: RegExp): { key: string; value: number } | null {
  const key = Object.keys(vars).find((k) => pattern.test(k));
  if (!key) return null;
  return { key, value: parseVariableNumber(vars[key]) };
}

export function mapReportRow(
  row: Tables<"Relatório">,
  sectorNameById: Map<string, string>,
): ReportRow {
  const vars = (row.variables as Record<string, unknown> | null) ?? {};
  const sectorId = row.IDsala ?? "";

  const horimeter = pickVariable(vars, VARIABLE_KEY_PATTERNS.horimeterHours);
  const vibration = pickVariable(vars, VARIABLE_KEY_PATTERNS.vibrationMax);
  const temperature = pickVariable(vars, VARIABLE_KEY_PATTERNS.temperatureMax);
  const matchedKeys = [horimeter, vibration, temperature].filter(Boolean).length;

  return {
    id: String(row.id),
    datetime: row.created_at ?? `${row.date ?? ""}T${row.hora ?? "00:00"}`,
    sectorId,
    sectorName: sectorNameById.get(sectorId) ?? sectorId,
    machineId: row.maquina_id != null ? String(row.maquina_id) : "",
    machineName: row.maquina ?? "",
    oee: (row.OEE ?? 0) * 100,
    availability: (row.OEE_disponibilidade ?? 0) * 100,
    productivity: (row.OEE_produtividade ?? 0) * 100,
    quality: (row.OEE_qualidade ?? 0) * 100,
    horimeterHours: horimeter?.value ?? 0,
    vibrationMax: vibration?.value ?? 0,
    temperatureMax: temperature?.value ?? 0,
    // Nao ha, hoje, uma variavel de "producao" identificavel nos dados legados
    // (as maquinas cadastradas sao de geracao/compressao de gases, nao de
    // producao por quantidade) — fica 0 ate existir uma fonte real.
    production: 0,
    productionUnit: "",
    additionalVariablesCount: Object.keys(vars).length - matchedKeys,
  };
}
