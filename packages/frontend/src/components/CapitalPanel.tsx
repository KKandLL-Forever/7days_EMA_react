import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calcStateAt } from '../utils/portfolio';

export default function CapitalPanel() {
  const {
    totalCapitalCN, totalCapitalUS,
    setTotalCapitalCN, setTotalCapitalUS,
    priceData, buys, sells,
    clearBuys, clearSells, clearAllTrades,
    stockSummaries, stocks, activeStockId,
  } = useAppStore();

  const activeStock = stocks.find(s => s.id === activeStockId);
  const activeMarket = activeStock?.market ?? 'cn';
  const isUS = activeMarket === 'us';
  const totalCapital = isUS ? totalCapitalUS : totalCapitalCN;

  const [inputCN, setInputCN] = useState<string>(totalCapitalCN ? String(totalCapitalCN) : '');
  const [inputUS, setInputUS] = useState<string>(totalCapitalUS ? String(totalCapitalUS) : '');
  const timerCN = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerUS = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setInputCN(totalCapitalCN ? String(totalCapitalCN) : ''); }, [totalCapitalCN]);
  useEffect(() => { setInputUS(totalCapitalUS ? String(totalCapitalUS) : ''); }, [totalCapitalUS]);

  const handleCNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputCN(e.target.value);
    if (timerCN.current) clearTimeout(timerCN.current);
    timerCN.current = setTimeout(() => setTotalCapitalCN(parseFloat(e.target.value) || 0), 600);
  };

  const handleUSChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUS(e.target.value);
    if (timerUS.current) clearTimeout(timerUS.current);
    timerUS.current = setTimeout(() => setTotalCapitalUS(parseFloat(e.target.value) || 0), 600);
  };

  const lastDate = priceData.length > 0 ? [...priceData].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.date : null;
  const latestClose = priceData.length > 0 ? [...priceData].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.close : 0;
  const state = lastDate ? calcStateAt(lastDate, buys, sells) : { remainShares: 0, totalInvested: 0, totalProceeds: 0, totalFees: 0 };

  const sym = isUS ? '$' : '¥';
  const posValue = state.remainShares * latestClose;
  const freeCapital = totalCapital - state.totalInvested + state.totalProceeds;
  const pnl = posValue + state.totalProceeds - state.totalInvested - state.totalFees;
  const pnlPct = state.totalInvested > 0 ? (pnl / state.totalInvested * 100) : 0;
  const posRatio = totalCapital > 0 ? (posValue / totalCapital * 100).toFixed(1) : '0';
  const freeRatio = totalCapital > 0 ? (freeCapital / totalCapital * 100).toFixed(1) : '100';
  const hasTrades = buys.length > 0 && priceData.length > 0;

  // Global summaries split by market
  const cnSummaries = stockSummaries.filter(s => s.market === 'cn');
  const usSummaries = stockSummaries.filter(s => s.market === 'us');
  const calcPnl = (list: typeof stockSummaries) =>
    list.reduce((sum, s) => sum + s.remainShares * s.latestClose + s.totalProceeds - s.totalInvested - s.totalFees, 0);
  const calcInvested = (list: typeof stockSummaries) => list.reduce((sum, s) => sum + s.totalInvested, 0);

  const globalCNPnl = calcPnl(cnSummaries);
  const globalUSPnl = calcPnl(usSummaries);
  const globalCNInvested = calcInvested(cnSummaries);
  const globalUSInvested = calcInvested(usSummaries);
  const hasMultipleStocks = stocks.length > 1;

  const cardBase = 'flex-1 min-w-[160px] p-4 rounded-xl border relative';

  return (
    <div className="mb-6">
      <div className="flex gap-4 flex-wrap">
        {/* 总资金卡片：CN + US */}
        <div className={`${cardBase} bg-blue-50 border-blue-400`}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">总资金</label>
            <button
              onClick={() => { if (confirm('清空全部总资金？')) { setTotalCapitalCN(0); setInputCN(''); setTotalCapitalUS(0); setInputUS(''); } }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          {/* 人民币账户 */}
          <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg transition-colors ${!isUS ? 'bg-white border border-blue-300 shadow-sm' : 'opacity-60'}`}>
            <span className="text-xs font-bold text-gray-500 w-6 shrink-0">¥</span>
            <input
              type="number" step="1000" min="0" placeholder="人民币账户"
              value={inputCN}
              onChange={handleCNChange}
              className="flex-1 text-base font-bold text-gray-800 bg-transparent border-none outline-none min-w-0"
            />
            {!isUS && <span className="text-xs text-blue-500 font-medium shrink-0">使用中</span>}
          </div>
          {/* 美元账户 */}
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${isUS ? 'bg-white border border-blue-300 shadow-sm' : 'opacity-60'}`}>
            <span className="text-xs font-bold text-gray-500 w-6 shrink-0">$</span>
            <input
              type="number" step="100" min="0" placeholder="美元账户"
              value={inputUS}
              onChange={handleUSChange}
              className="flex-1 text-base font-bold text-gray-800 bg-transparent border-none outline-none min-w-0"
            />
            {isUS && <span className="text-xs text-blue-500 font-medium shrink-0">使用中</span>}
          </div>
        </div>

        {/* 当前仓位 */}
        <div className={`${cardBase} bg-gray-50 border-gray-200`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              当前仓位{activeStock ? ` · ${activeStock.code}` : ''}
            </label>
            <button onClick={() => { if (confirm('清空全部买入记录？')) clearBuys(); }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalCapital > 0 ? `${sym}${posValue.toFixed(2)}` : '—'}</div>
          <div className="text-xs text-gray-400 mt-1">持仓市值占总资金 {posRatio}%</div>
        </div>

        {/* 可用资金 */}
        <div className={`${cardBase} bg-gray-50 border-gray-200`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">可用资金</label>
            <button onClick={() => { if (confirm('清空全部卖出记录？')) clearSells(); }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalCapital > 0 ? `${sym}${freeCapital.toFixed(2)}` : '—'}</div>
          <div className="text-xs text-gray-400 mt-1">占总资金 {freeRatio}%</div>
        </div>

        {/* 持仓盈亏 */}
        <div className={`${cardBase} border-gray-200 ${hasTrades ? (pnl > 0 ? 'bg-green-50' : pnl < 0 ? 'bg-red-50' : 'bg-gray-50') : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              持仓盈亏{activeStock ? ` · ${activeStock.code}` : ''}
            </label>
            <button onClick={() => { if (confirm('清空全部买入和卖出记录？')) clearAllTrades(); }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          {hasTrades ? (
            <>
              <div className={`text-xl font-bold ${pnl > 0 ? 'text-green-600' : pnl < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} {isUS ? 'USD' : '元'}
              </div>
              <div className="text-xs mt-1 text-gray-500">
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                {state.totalFees > 0 && (
                  <span className="text-orange-500 ml-2">已扣费用 {sym}{state.totalFees.toFixed(2)}</span>
                )}
              </div>
            </>
          ) : (
            <><div className="text-xl font-bold text-gray-800">—</div><div className="text-xs text-gray-400 mt-1"></div></>
          )}
        </div>
      </div>

      {/* 全局汇总 */}
      {hasMultipleStocks && stockSummaries.some(s => s.totalInvested > 0) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-6 mb-2 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">全部股票综合收益</span>
            {globalCNInvested > 0 && (
              <span className={`text-sm font-bold ${globalCNPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                🇨🇳 {globalCNPnl >= 0 ? '+' : ''}{globalCNPnl.toFixed(2)} 元
                <span className="ml-1 text-xs font-normal">({globalCNInvested > 0 ? ((globalCNPnl / globalCNInvested) * 100).toFixed(2) : '0.00'}%)</span>
              </span>
            )}
            {globalUSInvested > 0 && (
              <span className={`text-sm font-bold ${globalUSPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                🇺🇸 {globalUSPnl >= 0 ? '+' : ''}{globalUSPnl.toFixed(2)} USD
                <span className="ml-1 text-xs font-normal">({globalUSInvested > 0 ? ((globalUSPnl / globalUSInvested) * 100).toFixed(2) : '0.00'}%)</span>
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {stockSummaries.filter(s => s.totalInvested > 0 || s.remainShares > 0).map(s => {
              const pv = s.remainShares * s.latestClose;
              const p = pv + s.totalProceeds - s.totalInvested - s.totalFees;
              const pct = s.totalInvested > 0 ? (p / s.totalInvested * 100) : 0;
              const sym2 = s.market === 'us' ? '$' : '¥';
              return (
                <div key={s.stockId} className={`text-xs px-2 py-1 rounded border ${s.stockId === activeStockId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <span className="font-semibold text-gray-700">{s.code}</span>
                  {s.name && <span className="text-gray-400 ml-1">{s.name}</span>}
                  <span className={`ml-2 font-medium ${p > 0 ? 'text-green-600' : p < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {p >= 0 ? '+' : ''}{sym2}{p.toFixed(2)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
