import { useMemo, useState } from "react";

/**
 * Pagina uma lista que ja esta inteira na memoria, para a tela nao renderizar tudo de uma vez.
 * Volta para a pagina 1 quando `resetKey` muda (ex.: filtros) e recua se a lista encolher.
 */
export function useClientPagination<T>(items: T[], pageSize: number, resetKey: string) {
  const [state, setState] = useState({ resetKey, page: 1 });

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const requestedPage = state.resetKey === resetKey ? state.page : 1;
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );
  const setPage = (next: number) => setState({ resetKey, page: next });

  return { page, pageItems, setPage };
}
