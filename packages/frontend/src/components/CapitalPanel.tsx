import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calcStateAt } from '../utils/portfolio';

export default function CapitalPanel() {
  const {
    totalCapital, setTotalCapital,
    priceData, buys, sells,
    clearBuys, clearSells, clearAllTrades,
    stockSummaries, stocks, activeStockId,
  } = useAppStore();

  const [inputValue, setInputValue] = useState<string>(totalCapital ? String(totalCapital) : '');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(totalCapital ? String(totalCapital) : '');
  }, [totalCapital]);

  const handleCapitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputValue(raw);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setTotalCapital(parseFloat(raw) || 0);
    }, 600);
  };

  const lastDate = priceData.length > 0 ? [...priceData].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.date : null;
  const latestClose = priceData.length > 0 ? [...priceData].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!.close : 0;
  const state = lastDate ? calcStateAt(lastDate, buys, sells) : { remainShares: 0, totalInvested: 0, totalProceeds: 0, totalFees: 0 };

  const posValue = state.remainShares * latestClose;
  const freeCapital = totalCapital - state.totalInvested + state.totalProceeds;
  const pnl = posValue + state.totalProceeds - state.totalInvested - state.totalFees;
  const pnlPct = state.totalInvested > 0 ? (pnl / state.totalInvested * 100) : 0;
  const posRatio = totalCapital > 0 ? (posValue / totalCapital * 100).toFixed(1) : '0';
  const freeRatio = totalCapital > 0 ? (freeCapital / totalCapital * 100).toFixed(1) : '100';
  const hasTrades = buys.length > 0 && priceData.length > 0;

  // Global summary across all stocks
  const globalPnl = stockSummaries.reduce((sum, s) => {
    const posVal = s.remainShares * s.latestClose;
    return sum + posVal + s.totalProceeds - s.totalInvested - s.totalFees;
  }, 0);
  const globalInvested = stockSummaries.reduce((sum, s) => sum + s.totalInvested, 0);
  const globalPnlPct = globalInvested > 0 ? (globalPnl / globalInvested * 100) : 0;
  const hasMultipleStocks = stocks.length > 1;

  const cardBase = 'flex-1 min-w-[160px] p-4 rounded-xl border relative';

  const activeStock = stocks.find(s => s.id === activeStockId);

  return (
    <div className="mb-6">
      <div className="flex gap-4 flex-wrap">
        {/* 总资金 */}
        <div className={`${cardBase} bg-blue-50 border-blue-400`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">总资金</label>
            <button onClick={() => { if (confirm('清空总资金？')) { setTotalCapital(0); setInputValue(''); } }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          <input
            type="number" step="1000" min="0" placeholder="请输入总资金"
            value={inputValue}
            onChange={handleCapitalChange}
            className="w-full text-xl font-bold text-gray-800 bg-transparent border-none outline-none"
          />
          <div className="text-xs text-gray-400 mt-1">单位：元</div>
        </div>

        {/* 当前仓位资金 */}
        <div className={`${cardBase} bg-gray-50 border-gray-200`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              当前仓位{activeStock ? ` · ${activeStock.code}` : ''}
            </label>
            <button onClick={() => { if (confirm('清空全部买入记录？')) clearBuys(); }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalCapital > 0 ? `¥${posValue.toFixed(2)}` : '—'}</div>
          <div className="text-xs text-gray-400 mt-1">持仓市值占总资金 {posRatio}%</div>
        </div>

        {/* 可用资金 */}
        <div className={`${cardBase} bg-gray-50 border-gray-200`}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">可用资金</label>
            <button onClick={() => { if (confirm('清空全部卖出记录？')) clearSells(); }}
              className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalCapital > 0 ? `¥${freeCapital.toFixed(2)}` : '—'}</div>
          <div className="text-xs text-gray-400 mt-1">占总资金 {freeRatio}%</div>
        </div>

        {/* 当前股票盈亏 */}
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
                {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} 元
              </div>
              <div className="text-xs mt-1 text-gray-500">
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                {state.totalFees > 0 && (
                  <span className="text-orange-500 ml-2">已扣费用 ¥{state.totalFees.toFixed(2)}</span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-gray-800">—</div>
              <div className="text-xs text-gray-400 mt-1"></div>
            </>
          )}
        </div>
      </div>

      {/* 全局多股票汇总 */}
      {hasMultipleStocks && stockSummaries.some(s => s.totalInvested > 0) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">全部股票综合收益</span>
            <span className={`text-sm font-bold ${globalPnl > 0 ? 'text-green-600' : globalPnl < 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {globalPnl >= 0 ? '+' : ''}{globalPnl.toFixed(2)} 元
              {globalInvested > 0 && (
                <span className="ml-2 text-xs font-normal">
                  ({globalPnlPct >= 0 ? '+' : ''}{globalPnlPct.toFixed(2)}%)
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-4 flex-wrap">
            {stockSummaries.filter(s => s.totalInvested > 0 || s.remainShares > 0).map(s => {
              const pv = s.remainShares * s.latestClose;
              const p = pv + s.totalProceeds - s.totalInvested - s.totalFees;
              const pct = s.totalInvested > 0 ? (p / s.totalInvested * 100) : 0;
              return (
                <div key={s.stockId} className={`text-xs px-2 py-1 rounded border ${s.stockId === activeStockId ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                  <span className="font-semibold text-gray-700">{s.code}</span>
                  {s.name && <span className="text-gray-400 ml-1">{s.name}</span>}
                  <span className={`ml-2 font-medium ${p > 0 ? 'text-green-600' : p < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {p >= 0 ? '+' : ''}{p.toFixed(0)}元 ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
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
