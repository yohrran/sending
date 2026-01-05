import {
  SMA,
  RSI,
  MACD,
  Stochastic,
  BollingerBands,
} from "technicalindicators";
import type { ChartDataPoint, TechnicalIndicators } from "../types/stock";

export const calculateAllIndicators = (
  chartData: ChartDataPoint[]
): TechnicalIndicators | null => {
  if (chartData.length < 120) {
    console.warn("데이터 부족: 최소 120일 필요");
    return null;
  }

  const closes = chartData.map((d) => d.close);
  const highs = chartData.map((d) => d.high);
  const lows = chartData.map((d) => d.low);

  // 이동평균선 (20, 60, 120일)
  const ma20Array = SMA.calculate({ period: 20, values: closes });
  const ma60Array = SMA.calculate({ period: 60, values: closes });
  const ma120Array = SMA.calculate({ period: 120, values: closes });

  const ma20 = ma20Array[ma20Array.length - 1] || 0;
  const ma60 = ma60Array[ma60Array.length - 1] || 0;
  const ma120 = ma120Array[ma120Array.length - 1] || 0;

  // RSI (14일)
  const rsiArray = RSI.calculate({ period: 14, values: closes });
  const rsi = rsiArray[rsiArray.length - 1] || 50;

  // MACD (12, 26, 9)
  const macdArray = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const latestMACD = macdArray[macdArray.length - 1];
  const macd = {
    macd: latestMACD?.MACD || 0,
    signal: latestMACD?.signal || 0,
    histogram: latestMACD?.histogram || 0,
  };

  // 스토캐스틱 (14, 3)
  const stochasticArray = Stochastic.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
    signalPeriod: 3,
  });
  const latestStochastic = stochasticArray[stochasticArray.length - 1];
  const stochastic = {
    k: latestStochastic?.k || 50,
    d: latestStochastic?.d || 50,
  };

  // 볼린저밴드 (20, 2)
  const bollingerArray = BollingerBands.calculate({
    period: 20,
    values: closes,
    stdDev: 2,
  });
  const latestBollinger = bollingerArray[bollingerArray.length - 1];
  const bollingerBands = {
    upper: latestBollinger?.upper || 0,
    middle: latestBollinger?.middle || 0,
    lower: latestBollinger?.lower || 0,
  };

  return {
    ma20,
    ma60,
    ma120,
    rsi,
    macd,
    stochastic,
    bollingerBands,
  };
};

// 간단한 이동평균 계산 함수 (폴백용)
export const calculateSimpleMA = (prices: number[], period: number): number => {
  if (prices.length < period) return 0;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
};
