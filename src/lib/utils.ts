import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simula latencia de rede e uma pequena chance de erro, para validar loading/erro na UI. */
export async function simulateNetwork<T>(
  factory: () => T,
  opts: { minMs?: number; maxMs?: number; failRate?: number } = {},
): Promise<T> {
  const { minMs = 250, maxMs = 700, failRate = 0 } = opts;
  const delay = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  await sleep(delay);
  if (failRate > 0 && Math.random() < failRate) {
    throw new Error("Nao foi possivel completar a operacao. Tente novamente.");
  }
  return factory();
}
