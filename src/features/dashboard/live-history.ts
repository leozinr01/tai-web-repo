import { useMemo } from "react";

/** Quantas leituras guardar por variavel (com atualizacao a cada 5s, cobre os ultimos 10 minutos). */
const MAX_SAMPLES = 120;

interface Sample {
  at: number;
  value: number;
}

// Fica fora dos componentes para a serie sobreviver quando os cards sao remontados (ex.: troca de filtro).
const samplesBySeries = new Map<string, Sample[]>();

/**
 * Guarda a leitura atual de uma variavel e devolve a serie acumulada (mais antiga -> mais recente).
 * `at` identifica a atualizacao do dashboard: chamar de novo com o mesmo `at` nao duplica o ponto.
 */
export function recordLiveSample(seriesKey: string, at: number, value: number): number[] {
  const samples = samplesBySeries.get(seriesKey) ?? [];
  if (Number.isFinite(value) && samples[samples.length - 1]?.at !== at) {
    samples.push({ at, value });
    if (samples.length > MAX_SAMPLES) samples.shift();
    samplesBySeries.set(seriesKey, samples);
  }
  return samples.map((sample) => sample.value);
}

/**
 * Historico ao vivo de uma variavel: uma leitura real por atualizacao do dashboard, acumulada
 * enquanto a tela esta aberta. Usado quando a maquina ainda nao tem relatorios gravados.
 */
export function useLiveHistory(seriesKey: string, at: number, value: number): number[] {
  return useMemo(() => recordLiveSample(seriesKey, at, value), [seriesKey, at, value]);
}
