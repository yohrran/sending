import { useState } from "react";
import { Activity, Clock, Loader2, Printer, Calculator } from "lucide-react";
import { fetchTopStocks, fetchCurrentPrice, fetchDailyChartData } from "../services/kisApi";
import { calculateAllIndicators } from "../services/technicalIndicators";
import { calculateScore, determineStrategy, createScoringResult } from "../utils/scoring";
import type { ScoringResult } from "../types/stock";

const StockScreener = () => {
  const [activeTab, setActiveTab] = useState("checklist");
  const [recommendations, setRecommendations] = useState<ScoringResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [currentScanning, setCurrentScanning] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [totalBudget, setTotalBudget] = useState(50000000);
  const [totalStocks, setTotalStocks] = useState(50);

  const scanMarket = async () => {
    setLoading(true);
    setScanResults([]);
    setScannedCount(0);
    const results: ScoringResult[] = [];

    try {
      // 1. 시총 상위 50개 종목 조회
      console.log("📊 시총 상위 50개 종목 조회 중...");
      const stocks = await fetchTopStocks();
      setTotalStocks(stocks.length);
      console.log(`✅ ${stocks.length}개 종목 조회 완료`);

      // 2. 각 종목 분석
      for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        setCurrentScanning(stock.name);
        setScannedCount(i + 1);

        try {
          // 현재가 조회
          const stockData = await fetchCurrentPrice(stock);
          if (!stockData) {
            setScanResults((prev) => [
              ...prev,
              { ...stock, rejected: true, reason: "데이터 조회 실패" },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 500));
            continue;
          }

          // 일봉 데이터 조회
          const chartData = await fetchDailyChartData(stock.code);
          if (chartData.length < 120) {
            setScanResults((prev) => [
              ...prev,
              { ...stock, rejected: true, reason: "일봉 데이터 부족" },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          // 기술적 지표 계산
          const indicators = calculateAllIndicators(chartData);
          if (!indicators) {
            setScanResults((prev) => [
              ...prev,
              { ...stock, rejected: true, reason: "지표 계산 실패" },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }

          // 점수 계산
          const { score, signals } = calculateScore(stockData, indicators);

          if (score >= 95) {
            // 단타/스윙 전략 결정
            const type = determineStrategy(stockData, indicators);
            const result = createScoringResult(
              stockData,
              indicators,
              score,
              signals,
              type
            );
            results.push(result);
            setScanResults((prev) => [...prev, result]);
          } else {
            setScanResults((prev) => [
              ...prev,
              { ...stock, rejected: true, reason: `${score}점 (95점 미달)` },
            ]);
          }

          // Rate Limit 대응 (1초 간격)
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`${stock.name} 분석 실패:`, error);
          setScanResults((prev) => [
            ...prev,
            { ...stock, rejected: true, reason: "분석 오류" },
          ]);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // 점수 높은 순으로 정렬
      results.sort((a, b) => b.score - a.score);
      setRecommendations(results);
      console.log(`✅ 분석 완료: ${results.length}개 종목 추천`);
    } catch (error: any) {
      console.error("스캔 오류:", error);
    } finally {
      setCurrentScanning(null);
      setLoading(false);
    }
  };

  const calculateBudgetAllocation = () => {
    if (recommendations.length === 0) return [];
    const top5 = recommendations.slice(0, 5);
    const totalRequired = top5.reduce((sum, s: any) => sum + s.investAmount, 0);
    const ratio = totalBudget / totalRequired;
    return top5.map((s: any) => ({
      ...s,
      allocatedAmount: Math.floor(s.investAmount * ratio),
      allocatedQuantity: Math.floor((s.investAmount * ratio) / s.entryPrice),
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI 주식 스크리너 Pro
              </h1>
              <p className="text-slate-400 mt-1">
                저녁 분석 → 다음날 아침 9시 매수
              </p>
            </div>
            <button
              onClick={scanMarket}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  분석중
                </>
              ) : (
                "🎯 저녁 분석"
              )}
            </button>
          </div>

          {loading && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-blue-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {currentScanning
                    ? `${currentScanning} 분석 중...`
                    : "시총 상위 종목 조회 중..."}
                </p>
                <span className="text-sm font-semibold">
                  {scannedCount}/{totalStocks}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 transition-all"
                  style={{
                    width: `${totalStocks > 0 ? (scannedCount / totalStocks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              {scanResults.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
                  {scanResults.map((r: any, i) => (
                    <div
                      key={i}
                      className={`flex justify-between p-2 rounded text-sm ${
                        r.rejected
                          ? "bg-slate-800/50 text-slate-500"
                          : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      <span>
                        {r.rejected ? "❌" : "✅"} {r.name}
                      </span>
                      {r.rejected ? (
                        <span className="text-xs">{r.reason}</span>
                      ) : (
                        <span className="font-bold">{r.score}점</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-purple-300 mb-2">
                🌙 저녁 분석 → 아침 매수 루틴
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs text-purple-200">
                <div>
                  <b>1. 저녁 21:00</b>
                  <br />
                  스캔 실행
                </div>
                <div>
                  <b>2. 아침 09:00</b>
                  <br />
                  갭상승 5% 이하 매수
                </div>
                <div>
                  <b>3. 매수 즉시</b>
                  <br />
                  손절가 등록
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {[
            { id: "checklist", label: "📋 내일 매수" },
            { id: "budget", label: "💰 자금배분" },
            { id: "all", label: "📊 전체분석" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "checklist" && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-12 text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400 text-lg">
                  저녁 분석을 먼저 실행하세요
                </p>
              </div>
            ) : (
              <>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-green-300 text-lg">
                      📋 내일 아침 매수 체크리스트
                    </p>
                    <p className="text-sm text-green-200">
                      Top 5 | 갭상승 5% 이하만 매수
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-green-500/20 rounded-lg flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    프린트
                  </button>
                </div>

                {recommendations.slice(0, 5).map((s: any, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-5"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-blue-400">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold">{s.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              s.priority === "최우선"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {s.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              s.type === "단타"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {s.type}
                          </span>
                          <span className="text-slate-400 text-sm">
                            점수: {s.score}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded mb-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">✅ 진입가</p>
                        <p className="text-lg font-bold text-green-400">
                          {s.entryPrice.toLocaleString()}원
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">
                          📊 매수 수량
                        </p>
                        <p className="text-lg font-bold">
                          {s.quantity.toLocaleString()}주
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <p className="text-xs text-slate-400 mb-1">🛡️ 손절가</p>
                        <p className="font-bold text-red-400">
                          {s.stopLoss.toLocaleString()}원
                        </p>
                        <p className="text-xs text-slate-500">
                          {s.type === "단타" ? "-3%" : "-5%"}
                        </p>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                        <p className="text-xs text-slate-400 mb-1">🎯 목표1</p>
                        <p className="font-bold text-yellow-400">
                          {s.target1.toLocaleString()}원
                        </p>
                      </div>
                      <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                        <p className="text-xs text-slate-400 mb-1">🎯 목표2</p>
                        <p className="font-bold text-green-400">
                          {s.target2.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === "budget" && (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <Calculator className="w-5 h-5 text-blue-400 mb-2" />
              <input
                type="number"
                value={totalBudget}
                onChange={(e) => setTotalBudget(parseInt(e.target.value) || 0)}
                className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white w-full"
              />
            </div>

            {recommendations.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-12 text-center">
                <p className="text-slate-400">먼저 분석 실행</p>
              </div>
            ) : (
              calculateBudgetAllocation().map((s: any, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{s.name}</h3>
                    <span className="text-sm text-slate-400">{s.score}점</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400">배분 금액</p>
                      <p className="text-lg font-bold text-blue-400">
                        {s.allocatedAmount.toLocaleString()}원
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400">수량</p>
                      <p className="text-lg font-bold">
                        {s.allocatedQuantity.toLocaleString()}주
                      </p>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded">
                      <p className="text-xs text-slate-400">단가</p>
                      <p className="text-lg font-bold">
                        {s.entryPrice.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "all" && (
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-12 text-center">
                <p className="text-slate-400">스캔 결과 없음</p>
              </div>
            ) : (
              recommendations.map((s: any, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-blue-400">
                        #{i + 1}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold">{s.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              s.priority === "최우선"
                                ? "bg-red-100 text-red-700"
                                : s.priority === "우선"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {s.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              s.type === "단타"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {s.type}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                            {s.signal}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-400">
                        {s.score}점
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        거래량 {s.volumeRatio}배
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 bg-slate-900/50 p-4 rounded">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">현재가</p>
                      <p className="text-lg font-bold text-white">
                        {s.entryPrice.toLocaleString()}원
                      </p>
                      <p
                        className={`text-xs ${
                          s.change >= 0 ? "text-red-400" : "text-blue-400"
                        }`}
                      >
                        {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">손절가</p>
                      <p className="text-lg font-bold text-red-400">
                        {s.stopLoss.toLocaleString()}원
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.type === "단타" ? "-3%" : "-5%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">목표1</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {s.target1.toLocaleString()}원
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.type === "단타" ? "+5%" : "+10%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">목표2</p>
                      <p className="text-lg font-bold text-green-400">
                        {s.target2.toLocaleString()}원
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.type === "단타" ? "+8%" : "+15%"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-slate-900/30 p-2 rounded">
                      <p className="text-xs text-slate-400">매수금액</p>
                      <p className="text-sm font-bold text-blue-300">
                        {s.investAmount.toLocaleString()}원
                      </p>
                    </div>
                    <div className="bg-slate-900/30 p-2 rounded">
                      <p className="text-xs text-slate-400">수량</p>
                      <p className="text-sm font-bold text-blue-300">
                        {s.quantity.toLocaleString()}주
                      </p>
                    </div>
                    <div className="bg-slate-900/30 p-2 rounded">
                      <p className="text-xs text-slate-400">거래량</p>
                      <p className="text-sm font-bold text-blue-300">
                        {s.volume.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockScreener;
