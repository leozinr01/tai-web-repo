/**
 * Wrapper simples sobre localStorage com fallback em memoria (SSR-safe) e
 * serializacao JSON. Usado para preferencias de UI (ex.: sidebar recolhida).
 */
const memoryStore = new Map<string, string>();

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = hasLocalStorage() ? window.localStorage.getItem(key) : memoryStore.get(key) ?? null;
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      const raw = JSON.stringify(value);
      if (hasLocalStorage()) {
        window.localStorage.setItem(key, raw);
      } else {
        memoryStore.set(key, raw);
      }
    } catch {
      // silencioso: persistencia de preferencia de UI e best-effort
    }
  },
  remove(key: string): void {
    if (hasLocalStorage()) window.localStorage.removeItem(key);
    else memoryStore.delete(key);
  },
};
