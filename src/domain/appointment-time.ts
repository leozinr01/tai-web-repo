/**
 * Regras de horario e duracao dos apontamentos. Independente de React/navegador.
 * Compartilhavel com o futuro app React Native.
 */

const MINUTES_PER_DAY = 24 * 60;

/** "HH:MM" -> minutos desde a meia-noite. */
export function timeToMinutes(time: string): number {
  const [h = "0", m = "0"] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/**
 * Minutos entre inicio e fim. Fim antes do inicio e parada que passou da meia-noite
 * (22:00 -> 02:00 = 240). Inicio igual ao fim da 0 (nao 24h), para a validacao barrar.
 */
export function durationBetween(startTime: string, endTime: string): number {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  return diff >= 0 ? diff : diff + MINUTES_PER_DAY;
}

/** Minutos -> "HH:MM" (horas podem passar de 24). */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "HH:MM" (horas podem passar de 24) -> minutos. */
export function parseDuration(value: string): number {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
}
