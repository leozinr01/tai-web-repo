import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useClientPagination } from "@/hooks/use-client-pagination";

const numbers = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

describe("useClientPagination", () => {
  it("mostra so os itens da pagina atual", () => {
    const { result } = renderHook(() => useClientPagination(numbers(25), 10, "a"));
    expect(result.current.pageItems).toEqual(numbers(10));

    act(() => result.current.setPage(3));
    expect(result.current.page).toBe(3);
    expect(result.current.pageItems).toEqual([21, 22, 23, 24, 25]);
  });

  it("volta para a pagina 1 quando os filtros mudam", () => {
    const { result, rerender } = renderHook(({ key }) => useClientPagination(numbers(25), 10, key), {
      initialProps: { key: "a" },
    });
    act(() => result.current.setPage(2));
    rerender({ key: "b" });
    expect(result.current.page).toBe(1);
  });

  it("recua para a ultima pagina quando a lista encolhe", () => {
    const { result, rerender } = renderHook(({ items }) => useClientPagination(items, 10, "a"), {
      initialProps: { items: numbers(25) },
    });
    act(() => result.current.setPage(3));
    rerender({ items: numbers(12) });
    expect(result.current.page).toBe(2);
    expect(result.current.pageItems).toEqual([11, 12]);
  });
});
