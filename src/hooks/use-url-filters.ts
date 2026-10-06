import { useSearchParams } from "react-router-dom";

/**
 * Guarda filtros na query string (?setor=...&de=...), para sobreviverem ao recarregar
 * a pagina e poderem ser compartilhados por link. Filtro vazio some da URL.
 */
export function useUrlFilters<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();

  const values = Object.fromEntries(keys.map((key) => [key, params.get(key) ?? ""])) as Record<K, string>;

  const setFilter = (key: K, value: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );

  // Uma unica navegacao: chamadas seguidas de setParams no mesmo evento se sobrescreveriam.
  const clearFilters = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        keys.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );

  return { values, setFilter, clearFilters };
}
