import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateEMA } from '../utils/ema';
import { calcStateAt } from '../utils/portfolio';
import BuyModal from './BuyModal';
import SellModal from './SellModal';

interface ModalInfo {
  type: 'buy' | 'sell';
  date: string;
  price: number;
  remainShares?: number;
}

export default function EmaTable() {
  const { priceData, buys, sells, deletePriceData, totalCapitalCN, totalCapitalUS, stocks, activeStockId } = useAppStore();
  const activeMarket = stocks.find(s => s.id === activeStockId)?.market ?? 'cn';
  const totalCapital = activeMarket === 'us' ? totalCapitalUS : totalCapitalCN;
  const [modal, setModal] = useState<ModalInfo | null>(null);

  const sorted = useMemo(
    () => [...priceData].sort((a, b) => a.date.localeCompare(b.date)),
    [priceData]
  );

  const ema7  = useMemo(() => calculateEMA(sorted, 7),  [sorted]);
  const ema13 = useMemo(() => calculateEMA(sorted, 13), [sorted]);
  const ema20 = useMemo(() => calculateEMA(sorted, 20), [sorted]);

  const freeCapital = totalCapital - buys.reduce((s, b) => s + b.invested, 0) + sells.reduce((s, x) => s + x.proceeds, 0);

  const openModal = (type: 'buy' | 'sell', date: string, price: number) => {
    if (!totalCapital) { alert('请先填写总资金'); return; }
    if (type === 'sell') {
      const state = calcStateAt(date, buys, sells);
      if (state.remainShares < 100) { alert('当前持仓不足100股，无法减仓'); return; }
      setModal({ type, date, price, remainShares: state.remainShares });
    } else {
      setModal({ type, date, price });
    }
  };

  if (sorted.length === 0) return null;

  return (
    <>
      <div className="overflow-x-auto mt-2">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">交易日期</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">当日收盘价</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">7日EMA</th>
              <th className="px-3 py-2 bg-amber-100 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">次日7日挂单价</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">13日EMA</th>
              <th className="px-3 py-2 bg-amber-100 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">次日13日挂单价</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">20日EMA</th>
              <th className="px-3 py-2 bg-amber-100 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">次日20日挂单价</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">趋势判断</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">累计盈亏</th>
              <th className="px-3 py-2 bg-gray-50 border border-gray-200 font-semibold text-gray-700 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d, i) => {
              const state = calcStateAt(d.date, buys, sells);
              const dayBuys  = buys.filter(x => x.date === d.date);
              const daySells = sells.filter(x => x.date === d.date);
              const hasTrade = dayBuys.length > 0 || daySells.length > 0;

              const fees = state.totalFees ?? 0;
              const pnl  = state.totalInvested > 0
                ? state.remainShares * d.close + state.totalProceeds - state.totalInvested - fees
                : null;
              const pnlPct = pnl !== null && state.totalInvested > 0
                ? pnl / state.totalInvested * 100 : null;

              const trendUp   = i > 0 && ema20[i] != null && ema20[i-1] != null && ema20[i]! > ema20[i-1]!;
              const trendDown = i > 0 && ema20[i] != null && ema20[i-1] != null && ema20[i]! < ema20[i-1]!;

              const rowCls = hasTrade ? 'bg-yellow-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';

              return (
                <tr key={d.date} className={rowCls}>
                  <td className="px-3 py-2 border border-gray-100 text-center">
                    <div>{d.date}</div>
                    {dayBuys.map((b, j) => (
                      <span key={j} className="inline-block bg-amber-500 text-white text-[11px] rounded px-1 mt-0.5">
                        +仓 {b.shares}股 @¥{b.price.toFixed(2)}
                      </span>
                    ))}
                    {daySells.map((s, j) => (
                      <span key={j} className="inline-block bg-purple-600 text-white text-[11px] rounded px-1 mt-0.5 ml-0.5">
                        -仓 {s.label} ×{s.shares}股 @¥{s.price.toFixed(2)}
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-2 border border-gray-100 text-center">{d.close.toFixed(2)}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center">{ema7[i]  != null ? ema7[i]!.toFixed(3)  : '-'}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center bg-amber-50 font-bold">
                    {i > 0 && ema7[i-1]  != null ? ema7[i-1]!.toFixed(3)  : '-'}
                  </td>
                  <td className="px-3 py-2 border border-gray-100 text-center">{ema13[i] != null ? ema13[i]!.toFixed(3) : '-'}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center bg-amber-50 font-bold">
                    {i > 0 && ema13[i-1] != null ? ema13[i-1]!.toFixed(3) : '-'}
                  </td>
                  <td className="px-3 py-2 border border-gray-100 text-center">{ema20[i] != null ? ema20[i]!.toFixed(3) : '-'}</td>
                  <td className="px-3 py-2 border border-gray-100 text-center bg-amber-50 font-bold">
                    {i > 0 && ema20[i-1] != null ? ema20[i-1]!.toFixed(3) : '-'}
                  </td>
                  <td className={`px-3 py-2 border border-gray-100 text-center font-bold whitespace-nowrap
                    ${trendUp ? 'text-green-600' : trendDown ? 'text-red-600' : 'text-gray-400'}`}>
                    {trendUp ? '✅ 上升趋势-可加仓' : trendDown ? '❌ 下降趋势-禁止加仓' : '-'}
                  </td>
                  <td className={`px-3 py-2 border border-gray-100 text-center
                    ${pnl == null ? 'text-gray-400' : pnl > 0 ? 'text-green-600 font-bold' : pnl < 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                    {pnl != null ? (
                      <>
                        <div>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</div>
                        <div className="text-xs">{pnlPct! >= 0 ? '+' : ''}{pnlPct!.toFixed(2)}%</div>
                        {fees > 0 && <div className="text-xs text-orange-500">费¥{fees.toFixed(2)}</div>}
                      </>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-2 border border-gray-100 text-center whitespace-nowrap">
                    <button onClick={() => openModal('buy', d.date, d.close)}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs mr-1">加仓</button>
                    <button onClick={() => openModal('sell', d.date, d.close)}
                      disabled={state.remainShares < 100}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs mr-1 disabled:bg-gray-300 disabled:cursor-not-allowed">减仓</button>
                    <button onClick={() => deletePriceData(d.date)}
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs">删除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal?.type === 'buy' && (
        <BuyModal date={modal.date} price={modal.price} freeCapital={freeCapital} market={activeMarket} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'sell' && (
        <SellModal date={modal.date} price={modal.price} remainShares={modal.remainShares!} market={activeMarket} onClose={() => setModal(null)} />
      )}
    </>
  );
}
