import { useState } from 'react';
import { calcFees } from '../utils/fees';
import { useAppStore } from '../store/useAppStore';
import SharesInput from './SharesInput';
import TradePreview from './TradePreview';

interface Props {
  date: string;
  price: number;
  freeCapital: number;
  onClose: () => void;
}

const QUICK_SHARES = [100, 200, 300, 500, 1000];

export default function BuyModal({ date, price, freeCapital, onClose }: Props) {
  const addBuy = useAppStore(s => s.addBuy);
  const [shares, setShares] = useState<number | ''>(100);
  const [selected, setSelected] = useState<number | null>(null);
  const [customPrice, setCustomPrice] = useState<string>(price.toFixed(2));

  const currentShares = typeof shares === 'number' ? shares : 0;
  const currentPrice = parseFloat(customPrice) || price;

  const confirm = () => {
    if (isNaN(currentPrice) || currentPrice <= 0) { alert('请输入有效的买入价格'); return; }
    const snapped = Math.max(100, Math.round(currentShares / 100) * 100);
    if (snapped < 100) { alert('请输入至少100股'); return; }
    const invested = snapped * currentPrice;
    const fees = calcFees(invested, 'buy');
    addBuy({ date, price: currentPrice, shares: snapped, invested, fees, label: snapped + '股' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl p-7 w-[400px] shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-1">📈 加仓操作</h3>
        <div className="text-xs text-gray-500 mb-4 leading-loose">
          日期：<strong className="text-gray-800">{date}</strong>
          可用资金：<strong className="text-gray-800">¥{freeCapital.toFixed(2)}</strong>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            买入价格
            {customPrice !== price.toFixed(2) && parseFloat(customPrice) !== price && (
              <button
                type="button"
                onClick={() => setCustomPrice(price.toFixed(2))}
                className="ml-2 text-xs text-blue-500 hover:underline font-normal"
              >
                恢复收盘价
              </button>
            )}
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={customPrice}
            onChange={e => setCustomPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-amber-400"
          />
          {parseFloat(customPrice) !== price && (
            <p className="text-xs text-gray-400 mt-1">收盘价：¥{price.toFixed(2)}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_SHARES.map(n => (
            <button key={n} type="button"
              onClick={() => { setSelected(n); setShares(n); }}
              className={`px-3 py-2 rounded-md text-sm font-bold border-2 transition-all
                ${selected === n
                  ? 'bg-amber-400 text-white border-amber-500'
                  : 'bg-amber-50 text-amber-600 border-transparent hover:bg-amber-400 hover:text-white'}`}>
              {n}股
            </button>
          ))}
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-600 mb-1">买入股数（整百股）</label>
          <SharesInput value={shares} onChange={v => { setShares(v); setSelected(null); }} variant="buy" />
        </div>

        <div className="mb-4">
          <TradePreview shares={currentShares} price={currentPrice} type="buy" />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm">取消</button>
          <button onClick={confirm} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-bold">确认加仓</button>
        </div>
      </div>
    </div>
  );
}
