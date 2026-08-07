export interface IndicatorPoint {
  label: string;
  value: number;
}

export interface DashboardIndicators {
  oee: number;
  availability: number;
  productivity: number;
  quality: number;
  oeeHistory: IndicatorPoint[];
  availabilityHistory: IndicatorPoint[];
  productivityHistory: IndicatorPoint[];
  qualityHistory: IndicatorPoint[];
}
