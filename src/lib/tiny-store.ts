/**
 * Store minimalista (pub/sub) para estados globais simples de UI, como a
 * fila de toasts. Evita adicionar uma dependencia extra (ex.: zustand) fora
 * da stack solicitada.
 */
import { useEffect, useState } from "react";

export function create<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<() => void>();

  function getState(): T {
    return state;
  }

  function setState(updater: T | ((prev: T) => T)): void {
    state = typeof updater === "function" ? (updater as (prev: T) => T)(state) : updater;
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function useStore(): T {
    const [, forceRender] = useState(0);
    useEffect(() => subscribe(() => forceRender((n) => n + 1)), []);
    return state;
  }

  return { getState, setState, subscribe, useStore };
}
