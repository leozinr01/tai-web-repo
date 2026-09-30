import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Formata uma data ISO ("2026-09-30" ou com hora) para exibicao. Data vazia ou invalida vira "-",
 * em vez de derrubar a tela inteira (o date-fns lanca erro ao formatar data invalida).
 */
export function formatDate(value: string | null | undefined, pattern = "dd/MM/yyyy"): string {
  if (!value) return "-";
  const date = parseISO(value);
  return isValid(date) ? format(date, pattern) : "-";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
