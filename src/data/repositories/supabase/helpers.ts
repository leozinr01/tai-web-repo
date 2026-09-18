/**
 * Utilitarios de mapeamento entre o schema real do Supabase (tabelas em
 * portugues, legado) e o modelo de dominio deste painel.
 */
import { MachineStatus, UserRole, UserStatus } from "@/domain/types/enums";

export function parseBrDate(input: string | null | undefined): string {
  if (!input) return "";
  const [d, m, y] = input.split("/");
  if (!d || !m || !y) return "";
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function formatBrDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export function padTime(input: string | null | undefined): string {
  if (!input) return "00:00";
  const [h, mi] = input.split(":");
  return `${(h ?? "0").padStart(2, "0")}:${(mi ?? "0").padStart(2, "0")}`;
}

export function hhmmToMinutes(input: string | null | undefined): number {
  if (!input) return 0;
  const [h, m] = input.split(":");
  const hours = parseInt(h ?? "0", 10) || 0;
  const minutes = parseInt(m ?? "0", 10) || 0;
  return hours * 60 + minutes;
}

export function minutesToHHMM(total: number): string {
  const safe = Math.max(0, Math.round(total));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Converte textos legados tipo "08:00", "08:00hs" ou "'08:00'::text" em horas (numero). */
export function hoursTextToNumber(input: string | null | undefined): number {
  if (!input) return 0;
  const match = /(\d+)(?::(\d{1,2}))?/.exec(input);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10) || 0;
  const minutes = parseInt(match[2] ?? "0", 10) || 0;
  return hours + minutes / 60;
}

export function numberToHoursText(hours: number): string {
  const safe = Math.max(0, hours || 0);
  const wholeHours = Math.floor(safe);
  const minutes = Math.round((safe - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

const TIPO_TO_ROLE: Record<string, UserRole> = {
  Master: UserRole.MASTER,
  Admin: UserRole.ADMIN,
  Operator: UserRole.OPERATOR,
};

const ROLE_TO_TIPO: Record<UserRole, string> = {
  [UserRole.MASTER]: "Master",
  [UserRole.ADMIN]: "Admin",
  [UserRole.OPERATOR]: "Operator",
  [UserRole.VIEWER]: "Cliente",
};

export function tipoToRole(tipo: string | null | undefined): UserRole {
  if (!tipo) return UserRole.VIEWER;
  return TIPO_TO_ROLE[tipo] ?? UserRole.VIEWER;
}

export function roleToTipo(role: UserRole): string {
  return ROLE_TO_TIPO[role] ?? "Cliente";
}

export function statusToDomain(status: string | null | undefined): UserStatus {
  const s = (status ?? "").trim().toLowerCase();
  if (s === "inativo" || s === "inactive" || s === "desativado") return UserStatus.INACTIVE;
  return UserStatus.ACTIVE;
}

export function statusToDb(status: UserStatus): string {
  return status === UserStatus.ACTIVE ? "ativo" : "inativo";
}

export function machineStatusFromFlags(row: {
  producao: boolean | null;
  parado: boolean | null;
  emergencia: boolean | null;
}): MachineStatus {
  if (row.emergencia) return MachineStatus.EMERGENCIA;
  if (row.producao) return MachineStatus.PRODUZINDO;
  return MachineStatus.PARADO;
}

export function flagsFromMachineStatus(status: MachineStatus): {
  producao: boolean;
  parado: boolean;
  emergencia: boolean;
} {
  return {
    producao: status === MachineStatus.PRODUZINDO,
    parado: status === MachineStatus.PARADO,
    emergencia: status === MachineStatus.EMERGENCIA,
  };
}

const DB_TO_DOMAIN_KEY: Record<string, string> = {
  horimetro: "horimeter",
  vibracao: "vibration",
  temperatura: "temperature",
  velocidadeAtual: "speed",
  producaoAtual: "production",
};

const DOMAIN_TO_DB_KEY: Record<string, string> = {
  horimeter: "horimetro",
  vibration: "vibracao",
  temperature: "temperatura",
  speed: "velocidadeAtual",
  production: "producaoAtual",
};

export function dbVariableKeyToDomainKey(key: string): string {
  if (key in DB_TO_DOMAIN_KEY) return DB_TO_DOMAIN_KEY[key]!;
  const match = /^additional_(.+)$/.exec(key);
  return match ? match[1]! : key;
}

export function domainVariableKeyToDbKey(key: string): string {
  if (key in DOMAIN_TO_DB_KEY) return DOMAIN_TO_DB_KEY[key]!;
  return `additional_${key}`;
}

export function machineCode(name: string): string {
  return name.trim().slice(0, 6).toUpperCase().replace(/\s+/g, "-");
}

/** Extrai um numero de um valor jsonb de `Relatório.variables`, cuja chave inclui a unidade entre parenteses. */
export function findVariableValue(
  variables: Record<string, unknown> | null | undefined,
  matchers: string[],
): number {
  if (!variables) return 0;
  for (const key of Object.keys(variables)) {
    const lower = key.toLowerCase();
    if (matchers.some((m) => lower.includes(m))) {
      const raw = variables[key];
      const num = typeof raw === "number" ? raw : parseFloat(String(raw));
      return Number.isFinite(num) ? num : 0;
    }
  }
  return 0;
}
