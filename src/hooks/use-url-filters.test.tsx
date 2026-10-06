import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useUrlFilters } from "@/hooks/use-url-filters";

const KEYS = ["setor", "de"] as const;

function setup(initialUrl: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialUrl]}>{children}</MemoryRouter>
  );
  return renderHook(() => ({ filters: useUrlFilters(KEYS), search: useLocation().search }), { wrapper });
}

describe("useUrlFilters", () => {
  it("le os filtros da URL e devolve vazio para os ausentes", () => {
    const { result } = setup("/apontamentos?setor=Usinagem");
    expect(result.current.filters.values).toEqual({ setor: "Usinagem", de: "" });
  });

  it("grava o filtro na URL e remove quando fica vazio", () => {
    const { result } = setup("/apontamentos");
    act(() => result.current.filters.setFilter("de", "2026-01-10"));
    expect(result.current.search).toBe("?de=2026-01-10");

    act(() => result.current.filters.setFilter("de", ""));
    expect(result.current.search).toBe("");
  });

  it("limpa so os filtros da tela, preservando outros parametros", () => {
    const { result } = setup("/apontamentos?setor=Usinagem&de=2026-01-10&outro=1");
    act(() => result.current.filters.clearFilters());
    expect(result.current.search).toBe("?outro=1");
  });
});
