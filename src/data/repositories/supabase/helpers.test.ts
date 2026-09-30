import { describe, expect, it } from "vitest";
import { fetchAllRows, RANGE_NOT_SATISFIABLE, SUPABASE_MAX_ROWS } from "@/data/repositories/supabase/helpers";

/** Simula o PostgREST: corta em SUPABASE_MAX_ROWS e da erro quando o range comeca depois do fim. */
function fakeTable(total: number) {
  const rows = Array.from({ length: total }, (_, i) => i);
  const calls: Array<[number, number]> = [];
  const build = (from: number, to: number) => {
    calls.push([from, to]);
    if (from > 0 && from >= total) {
      return Promise.resolve({ data: null, error: { message: "Requested range not satisfiable", code: RANGE_NOT_SATISFIABLE } });
    }
    return Promise.resolve({ data: rows.slice(from, Math.min(to + 1, from + SUPABASE_MAX_ROWS)), error: null });
  };
  return { build, calls };
}

describe("fetchAllRows", () => {
  it("busca alem do limite de 1000 linhas", async () => {
    const { build } = fakeTable(2500);
    const rows = await fetchAllRows<number>(build);
    expect(rows).toHaveLength(2500);
    expect(new Set(rows).size).toBe(2500);
  });

  it("para sem erro quando o total e multiplo exato de 1000", async () => {
    const { build, calls } = fakeTable(2000);
    await expect(fetchAllRows<number>(build)).resolves.toHaveLength(2000);
    expect(calls).toHaveLength(3);
  });

  it("tabela vazia", async () => {
    const { build } = fakeTable(0);
    await expect(fetchAllRows<number>(build)).resolves.toEqual([]);
  });

  it("repassa outros erros", async () => {
    const build = () => Promise.resolve({ data: null, error: { message: "permission denied" } });
    await expect(fetchAllRows(build)).rejects.toThrow("permission denied");
  });
});
