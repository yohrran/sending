import type {
  StockData,
  TechnicalIndicators,
  ScoringResult,
} from "../types/stock";

export const calculateScore = (
  stockData: StockData,
  indicators: TechnicalIndicators
): { score: number; signals: string[] } => {
  let score = 0;
  const signals: string[] = [];

  const { price, change, volume, avgVolume } = stockData;
  const { ma20, ma60, ma120, rsi, macd, stochastic, bollingerBands } =
    indicators;
  const volumeRatio = volume / avgVolume;

  // 1. 추세 지표 (40점)
  // 1-1. 이동평균선 정배열 (20점)
  if (price > ma20 && ma20 > ma60 && ma60 > ma120) {
    score += 20;
    signals.push("정배열");
  } else if (price > ma20 && ma20 > ma60) {
    score += 15;
    signals.push("이평선상승");
  } else if (price > ma20) {
    score += 10;
    signals.push("20일선돌파");
  }

  // 1-2. MACD (20점)
  if (macd.macd > macd.signal && macd.macd > 0) {
    score += 20;
    signals.push("MACD강세");
  } else if (macd.macd > macd.signal) {
    score += 15;
    signals.push("MACD골든");
  }
  if (macd.histogram > 0) {
    score += 5;
    signals.push("히스토증가");
  }

  // 2. 모멘텀 지표 (35점)
  // 2-1. RSI (15점)
  if (rsi >= 40 && rsi <= 60) {
    score += 15;
    signals.push("RSI최적");
  } else if (rsi >= 30 && rsi <= 70) {
    score += 10;
    signals.push("RSI정상");
  } else {
    score += 5;
    signals.push("RSI과열");
  }

  // 2-2. 스토캐스틱 (10점)
  if (stochastic.k > stochastic.d && stochastic.k < 80) {
    score += 10;
    signals.push("스토골든");
  } else if (stochastic.k > stochastic.d) {
    score += 7;
    signals.push("스토상승");
  }

  // 2-3. 가격 모멘텀 (10점)
  if (change > 4) {
    score += 10;
    signals.push("강력상승");
  } else if (change > 2) {
    score += 7;
    signals.push("상승세");
  } else if (change > 0) {
    score += 3;
  }

  // 3. 변동성 지표 (15점)
  // 3-1. 볼린저밴드 (15점)
  if (price > bollingerBands.lower && price < bollingerBands.middle) {
    score += 15;
    signals.push("매수구간");
  } else if (price > bollingerBands.middle && price < bollingerBands.upper) {
    score += 10;
    signals.push("상승구간");
  } else if (price < bollingerBands.lower) {
    score += 12;
    signals.push("과매도");
  } else {
    score += 5;
    signals.push("과매수");
  }

  // 4. 거래량 (10점)
  if (volumeRatio > 2.5) {
    score += 10;
    signals.push("거래량폭발");
  } else if (volumeRatio > 1.5) {
    score += 7;
    signals.push("거래량증가");
  } else if (volumeRatio > 1) {
    score += 3;
  }

  return { score: Math.min(score, 100), signals };
};

export const determineStrategy = (
  stockData: StockData,
  indicators: TechnicalIndicators
): "단타" | "스윙" => {
  let dantaScore = 0;
  let swingScore = 0;

  const { change, volume, avgVolume } = stockData;
  const { ma20, ma60, ma120, rsi, macd, stochastic, bollingerBands } =
    indicators;
  const volumeRatio = volume / avgVolume;

  // 단타 시그널 (빠른 수익, 빠른 탈출)
  if (volumeRatio > 2.5) dantaScore += 3;
  if (change > 3) dantaScore += 3;
  if (rsi > 60 && rsi < 75) dantaScore += 2;
  if (stochastic.k > stochastic.d) dantaScore += 2;

  // 스윙 시그널 (안정적 상승, 추세 지속)
  if (ma20 > ma60 && ma60 > ma120) swingScore += 4;
  if (macd.histogram > 0 && macd.macd > macd.signal) swingScore += 3;
  if (rsi > 45 && rsi < 60) swingScore += 2;
  if (
    stockData.price > bollingerBands.lower &&
    stockData.price < bollingerBands.middle
  )
    swingScore += 1;

  return dantaScore > swingScore ? "단타" : "스윙";
};

export const createScoringResult = (
  stockData: StockData,
  indicators: TechnicalIndicators,
  score: number,
  signals: string[],
  type: "단타" | "스윙"
): ScoringResult => {
  const { price, volume, avgVolume } = stockData;
  const volumeRatio = (volume / avgVolume).toFixed(1);

  // 단타/스윙별 투자 금액 및 목표가
  const investAmount = type === "단타" ? 10000000 : 20000000;
  const stopLoss =
    type === "단타" ? Math.round(price * 0.97) : Math.round(price * 0.95);
  const target1 =
    type === "단타" ? Math.round(price * 1.05) : Math.round(price * 1.1);
  const target2 =
    type === "단타" ? Math.round(price * 1.08) : Math.round(price * 1.15);

  // 우선순위 결정
  let priority: "최우선" | "우선" | "일반";
  if (score >= 98) priority = "최우선";
  else if (score >= 96) priority = "우선";
  else priority = "일반";

  return {
    ...stockData,
    indicators,
    score,
    signal: signals.join(" + ") || "안정매수",
    type,
    volumeRatio,
    entryPrice: price,
    stopLoss,
    target1,
    target2,
    investAmount,
    quantity: Math.floor(investAmount / price),
    priority,
  };
};
