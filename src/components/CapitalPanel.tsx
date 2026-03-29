import { useAppStore } from '../store/useAppStore';
import { calcStateAt } from '../utils/portfolio';

export default function CapitalPanel() {
  const { totalCapital, setTotalCapital, priceData, buys, sells, clearBuys, clearSells, clearAllTrades } = useAppStore();

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

  const cardBase = 'flex-1 min-w-[160px] p-4 rounded-xl border relative';

  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      {/* 总资金 */}
      <div className={`${cardBase} bg-blue-50 border-blue-400`}>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">总资金</label>
          <button onClick={() => { if (confirm('清空总资金？')) setTotalCapital(0); }}
            className="text-gray-300 hover:text-red-500 text-sm leading-none">✕</button>
        </div>
        <input
          type="number" step="1000" min="0" placeholder="请输入总资金"
          value={totalCapital || ''}
          onChange={e => setTotalCapital(parseFloat(e.target.value) || 0)}
          className="w-full text-xl font-bold text-gray-800 bg-transparent border-none outline-none"
        />
        <div className="text-xs text-gray-400 mt-1">单位：元</div>
      </div>

      {/* 当前仓位资金 */}
      <div className={`${cardBase} bg-gray-50 border-gray-200`}>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">当前仓位资金</label>
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

      {/* 持仓总盈亏 */}
      <div className={`${cardBase} border-gray-200 ${hasTrades ? (pnl > 0 ? 'bg-green-50' : pnl < 0 ? 'bg-red-50' : 'bg-gray-50') : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">持仓总盈亏（当前）</label>
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
  );
}
