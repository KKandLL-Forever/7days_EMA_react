import { useAppStore } from '../store/useAppStore';

export default function HistoryPanel() {
  const { buys, sells, deleteBuy, deleteSell, clearAllTrades } = useAppStore();

  const firstBuyDate = buys.length > 0
    ? buys.reduce((min, b) => b.date < min ? b.date : min, buys[0].date)
    : null;

  const allTrades = [
    ...buys.map((b, i) => ({ ...b, _type: 'buy' as const, _idx: i })),
    ...sells.map((s, i) => ({ ...s, _type: 'sell' as const, _idx: i })),
  ].sort((a, b) => b.date.localeCompare(a.date) || (a._type === 'buy' ? -1 : 1));

  const handleDelete = (type: 'buy' | 'sell', idx: number) => {
    if (!confirm('删除此条操作记录？')) return;
    type === 'buy' ? deleteBuy(idx) : deleteSell(idx);
  };

  return (
    <div className="w-[260px] shrink-0 border border-gray-200 rounded-xl bg-gray-50 overflow-hidden sticky top-5 self-start">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white">
        <h3 className="text-sm font-semibold">📋 历史操作记录</h3>
        <button onClick={() => { if (confirm('清空全部买入和卖出记录？')) clearAllTrades(); }}
          className="text-xs border border-white/40 px-2 py-1 rounded hover:bg-white/15">清空</button>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {allTrades.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">暂无操作记录</div>
        ) : allTrades.map((t, i) => {
          const isBuy   = t._type === 'buy';
          const isBuild = isBuy && t.date === firstBuyDate;
          const cost = isBuy ? (t as typeof buys[0]).invested : (t as typeof sells[0]).proceeds;
          const feeAmt = t.fees?.total ?? 0;

          const badgeCls = isBuild
            ? 'bg-green-100 text-green-800'
            : isBuy ? 'bg-amber-100 text-amber-700'
            : 'bg-purple-100 text-purple-800';
          const badgeText = isBuild ? '建仓' : isBuy ? '加仓' : '减仓';

          return (
            <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badgeText}</span>
                <span className="text-xs text-gray-400">{t.date}</span>
                <button onClick={() => handleDelete(t._type, t._idx)}
                  className="text-gray-300 hover:text-red-500 text-xs leading-none">✕</button>
              </div>
              <div className="text-sm font-bold text-gray-800">{t.shares} 股 @ ¥{t.price.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {isBuy ? '成本' : '回笼'} ¥{cost.toFixed(2)}
                {t.label && <span className="ml-2">{t.label}</span>}
                {feeAmt > 0 && <span className="ml-2 text-orange-500">费¥{feeAmt.toFixed(2)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
