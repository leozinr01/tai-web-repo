import { describe, expect, it } from "vitest";
import { recordLiveSample } from "@/features/dashboard/live-history";

describe("recordLiveSample", () => {
  it("acumula uma leitura por atualizacao, na ordem em que chegaram", () => {
    recordLiveSample("maquina-a", 1, 10);
    recordLiveSample("maquina-a", 2, 12);
    expect(recordLiveSample("maquina-a", 3, 11)).toEqual([10, 12, 11]);
  });

  it("nao duplica o ponto quando a mesma atualizacao e registrada de novo", () => {
    recordLiveSample("maquina-b", 1, 10);
    expect(recordLiveSample("maquina-b", 1, 10)).toEqual([10]);
  });

  it("ignora valor que nao e numero e mantem as series separadas", () => {
    expect(recordLiveSample("maquina-c", 1, Number.NaN)).toEqual([]);
    expect(recordLiveSample("maquina-d", 1, 5)).toEqual([5]);
  });

  it("guarda so as leituras mais recentes", () => {
    let series: number[] = [];
    for (let i = 1; i <= 130; i += 1) series = recordLiveSample("maquina-e", i, i);
    expect(series).toHaveLength(120);
    expect(series[0]).toBe(11);
    expect(series[119]).toBe(130);
  });
});
