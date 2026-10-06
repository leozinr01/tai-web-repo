export interface IndicatorPoint {
  label: string;
  value: number;
}

export interface DashboardIndicators {
  /** Valores atuais em %; null quando a empresa ainda nao tem leitura. */
  oee: number | null;
  availability: number | null;
  productivity: number | null;
  quality: number | null;
  /** Somente leituras reais (mais antiga -> mais recente); pode vir vazio ou com um unico ponto. */
  oeeHistory: IndicatorPoint[];
  availabilityHistory: IndicatorPoint[];
  productivityHistory: IndicatorPoint[];
  qualityHistory: IndicatorPoint[];
}
