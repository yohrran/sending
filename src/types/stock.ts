export interface StockBasicInfo {
  code: string;
  name: string;
}

export interface StockData extends StockBasicInfo {
  price: number;
  change: number;
  volume: number;
  avgVolume: number;
  per: number;
  pbr: number;
  roe: number;
}

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  ma20: number;
  ma60: number;
  ma120: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  stochastic: { k: number; d: number };
  bollingerBands: { upper: number; middle: number; lower: number };
}

export interface ScoringResult extends StockData {
  indicators: TechnicalIndicators;
  score: number;
  signal: string;
  type: "단타" | "스윙";
  volumeRatio: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  investAmount: number;
  quantity: number;
  priority: "최우선" | "우선" | "일반";
}
