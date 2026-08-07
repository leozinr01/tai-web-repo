/**
 * Wrapper simples sobre localStorage com fallback em memoria (SSR-safe) e
 * serializacao JSON. Usado pelos adaptadores mockados para persistir dados
 * entre recarregamentos de pagina.
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
      // silencioso: persistencia e best-effort em ambiente mockado
    }
  },
  remove(key: string): void {
    if (hasLocalStorage()) window.localStorage.removeItem(key);
    else memoryStore.delete(key);
  },
};

export const STORAGE_KEYS = {
  SESSION: "tai:session",
  COMPANIES: "tai:companies",
  USERS: "tai:users",
  SECTORS: "tai:sectors",
  MACHINES: "tai:machines",
  APPOINTMENTS: "tai:appointments",
  WORK_ORDERS: "tai:work_orders",
} as const;
