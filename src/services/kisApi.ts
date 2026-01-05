import type { StockBasicInfo, StockData, ChartDataPoint } from "../types/stock";

const KIS_APP_KEY = import.meta.env.VITE_KIS_APP_KEY;
const KIS_APP_SECRET = import.meta.env.VITE_KIS_APP_SECRET;
const KIS_BASE_URL = "/api";

const TOKEN_STORAGE_KEY = "kis_access_token";
const TOKEN_EXPIRY_KEY = "kis_token_expiry";

// 토큰 발급 및 관리
export const getKISAccessToken = async (): Promise<string | null> => {
  const now = Date.now();
  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const savedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (savedToken && savedExpiry && parseInt(savedExpiry) > now) {
    return savedToken;
  }

  try {
    const response = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: KIS_APP_KEY,
        appsecret: KIS_APP_SECRET,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      const expiryTime = now + 23 * 60 * 60 * 1000;
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      return data.access_token;
    } else {
      console.error("토큰 없음. 응답:", data);
      return null;
    }
  } catch (error: any) {
    console.error("토큰 발급 예외:", error);
    return null;
  }
};

// 시가총액 상위 30개 종목 조회
export const fetchMarketCapRank = async (): Promise<StockBasicInfo[]> => {
  try {
    const token = await getKISAccessToken();
    if (!token) throw new Error("토큰 발급 실패");

    // 한투 API: 국내주식 시가총액 상위 (v1_국내주식-091)
    const response = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap?` +
        `fid_rsfl_rate2=&` + // 등락율 하한
        `fid_cond_mrkt_div_code=J&` + // J: 주식, ETF, ETN 포함
        `fid_cond_scr_div_code=20171&` + // 시가총액 상위
        `fid_input_iscd=0000&` + // 전체
        `fid_rank_sort_cls_code=0&` + // 0: 시가총액순
        `fid_input_cnt_1=0&` + // 입력 수량
        `fid_prc_cls_code=0&` + // 가격 구분
        `fid_input_price_1=&` + // 입력 가격1
        `fid_input_price_2=&` + // 입력 가격2
        `fid_vol_cnt=&` + // 거래량
        `fid_trgt_cls_code=0&` + // 대상 구분
        `fid_trgt_exls_cls_code=0&` + // 제외 구분
        `fid_div_cls_code=0&` + // 분류 구분
        `fid_rsfl_rate1=`, // 등락율 상한
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          authorization: `Bearer ${token}`,
          appkey: KIS_APP_KEY,
          appsecret: KIS_APP_SECRET,
          tr_id: "FHPST01710000", // 시가총액 상위 조회
          custtype: "P", // P: 개인
        },
      }
    );

    // 응답 상태 확인
    if (!response.ok) {
      const text = await response.text();
      console.error("API 응답 오류:", response.status, text);
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      console.warn("시총 순위 API 응답이 비어있음. 기본 종목 리스트 사용");
      return [];
    }

    const data = JSON.parse(text);

    // rt_cd가 빈 문자열이거나 "0"이 아니면 오류
    if (!data.rt_cd || data.rt_cd !== "0") {
      console.error("시총 순위 API 오류 또는 빈 응답:", data);
      throw new Error(`API 오류: ${data.msg1 || data.msg_cd || '빈 응답'}`);
    }

    if (!data.output || !Array.isArray(data.output) || data.output.length === 0) {
      console.warn("시총 순위 데이터 형식 오류 또는 빈 배열:", data);
      return [];
    }

    return data.output.map((item: any) => ({
      code: item.mksc_shrn_iscd || item.stck_shrn_iscd,
      name: item.hts_kor_isnm,
    }));
  } catch (error: any) {
    console.error("시총 순위 조회 실패:", error);
    return [];
  }
};

// 현재가 조회
export const fetchCurrentPrice = async (
  stock: StockBasicInfo
): Promise<StockData | null> => {
  try {
    const token = await getKISAccessToken();
    if (!token) throw new Error("토큰 발급 실패");

    const response = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${stock.code}`,
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
          appkey: KIS_APP_KEY,
          appsecret: KIS_APP_SECRET,
          tr_id: "FHKST01010100",
        },
      }
    );

    const priceData = await response.json();

    if (priceData.rt_cd !== "0") {
      throw new Error(`API 오류: ${priceData.msg1}`);
    }

    const output = priceData.output;
    const price = parseInt(output.stck_prpr);
    const change = parseFloat(output.prdy_ctrt);
    const volume = parseInt(output.acml_vol);

    return {
      ...stock,
      price,
      change,
      volume,
      avgVolume: Math.round(volume * 0.7),
      per: parseFloat(output.per) || 12,
      pbr: parseFloat(output.pbr) || 1.2,
      roe: 10 + Math.random() * 10,
    };
  } catch (error: any) {
    console.error(`현재가 조회 실패 (${stock.name}):`, error);
    return null;
  }
};

// 일봉 데이터 조회 (120일)
export const fetchDailyChartData = async (
  stockCode: string
): Promise<ChartDataPoint[]> => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const cacheKey = `daily_chart_${stockCode}_${todayStr}`;

  // 캐시 확인
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const cachedData = JSON.parse(cached);
    if (cachedData.length >= 120) {
      return cachedData;
    }
  }

  try {
    const token = await getKISAccessToken();
    if (!token) throw new Error("토큰 발급 실패");

    // 200일 전부터 조회 (주말/휴장일 제외하면 120일 확보)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 200);
    const startDateStr = startDate
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");

    const response = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice?` +
        `FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${stockCode}&` +
        `FID_INPUT_DATE_1=${startDateStr}&FID_INPUT_DATE_2=${todayStr}&` +
        `FID_PERIOD_DIV_CODE=D&FID_ORG_ADJ_PRC=0`,
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
          appkey: KIS_APP_KEY,
          appsecret: KIS_APP_SECRET,
          tr_id: "FHKST03010100",
        },
      }
    );

    const data = await response.json();

    if (data.rt_cd !== "0") {
      throw new Error(`API 오류: ${data.msg1}`);
    }

    if (!data.output2 || !Array.isArray(data.output2)) {
      throw new Error("일봉 데이터 형식 오류");
    }

    const chartData: ChartDataPoint[] = data.output2
      .map((item: any) => ({
        date: item.stck_bsop_date,
        open: parseInt(item.stck_oprc),
        high: parseInt(item.stck_hgpr),
        low: parseInt(item.stck_lwpr),
        close: parseInt(item.stck_clpr),
        volume: parseInt(item.acml_vol),
      }))
      .reverse(); // 과거 → 현재 순서로 정렬

    // 최소 120일 이상인 경우만 캐시 저장
    if (chartData.length >= 120) {
      localStorage.setItem(cacheKey, JSON.stringify(chartData));
    }

    return chartData;
  } catch (error: any) {
    console.error(`일봉 데이터 조회 실패 (${stockCode}):`, error);
    return [];
  }
};

// 시총 상위 50개 종목 조회 (API 30개 + 수동 20개)
export const fetchTopStocks = async (): Promise<StockBasicInfo[]> => {
  // 기본 50개 종목 (시총 상위 기준)
  const defaultStocks: StockBasicInfo[] = [
    // 시총 Top 10
    { code: "005930", name: "삼성전자" },
    { code: "000660", name: "SK하이닉스" },
    { code: "373220", name: "LG에너지솔루션" },
    { code: "207940", name: "삼성바이오로직스" },
    { code: "005380", name: "현대차" },
    { code: "035420", name: "NAVER" },
    { code: "000270", name: "기아" },
    { code: "051910", name: "LG화학" },
    { code: "005490", name: "POSCO홀딩스" },
    { code: "035720", name: "카카오" },

    // 반도체/IT
    { code: "006400", name: "삼성SDI" },
    { code: "009150", name: "삼성전기" },
    { code: "018260", name: "삼성에스디에스" },
    { code: "034730", name: "SK" },
    { code: "003550", name: "LG" },

    // 자동차/모빌리티
    { code: "012330", name: "현대모비스" },
    { code: "086280", name: "현대글로비스" },

    // 바이오/제약
    { code: "068270", name: "셀트리온" },
    { code: "326030", name: "SK바이오팜" },
    { code: "128940", name: "한미약품" },
    { code: "196170", name: "알테오젠" },

    // 금융
    { code: "105560", name: "KB금융" },
    { code: "055550", name: "신한지주" },
    { code: "086790", name: "하나금융지주" },
    { code: "316140", name: "우리금융지주" },
    { code: "032830", name: "삼성생명" },
    { code: "024110", name: "기업은행" },

    // 에너지/화학
    { code: "009830", name: "한화솔루션" },
    { code: "010950", name: "S-Oil" },
    { code: "011170", name: "롯데케미칼" },
    { code: "010130", name: "고려아연" },

    // 유통/소비재
    { code: "051900", name: "LG생활건강" },
    { code: "097950", name: "CJ제일제당" },
    { code: "271560", name: "오리온" },
    { code: "033780", name: "KT&G" },

    // 엔터테인먼트
    { code: "035900", name: "JYP Ent." },
    { code: "041510", name: "SM" },
    { code: "352820", name: "하이브" },

    // 건설/인프라
    { code: "028260", name: "삼성물산" },
    { code: "000720", name: "현대건설" },
    { code: "011200", name: "HMM" },

    // 통신
    { code: "030200", name: "KT" },
    { code: "017670", name: "SK텔레콤" },

    // 전력/유틸리티
    { code: "015760", name: "한국전력" },

    // 기타
    { code: "251270", name: "넷마블" },
    { code: "096770", name: "SK이노베이션" },
    { code: "036570", name: "엔씨소프트" },
    { code: "018880", name: "한온시스템" },
    { code: "009540", name: "HD한국조선해양" },
    { code: "042700", name: "한미반도체" },
  ];

  try {
    const top30 = await fetchMarketCapRank();

    if (top30.length > 0) {
      console.log(`✅ API로 ${top30.length}개 종목 조회 성공`);
      // API 성공 시 API 30개 + 기본 20개
      const allStocks = [...top30, ...defaultStocks];
      const uniqueStocks = Array.from(
        new Map(allStocks.map((stock) => [stock.code, stock])).values()
      );
      return uniqueStocks.slice(0, 50);
    } else {
      console.warn("⚠️ API 조회 실패. 기본 50개 종목 사용");
      return defaultStocks;
    }
  } catch (error) {
    console.error("시총 조회 오류:", error);
    console.warn("⚠️ 기본 50개 종목으로 진행");
    return defaultStocks;
  }
};
