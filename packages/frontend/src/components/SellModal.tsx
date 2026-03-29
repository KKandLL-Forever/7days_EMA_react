import { useState } from 'react';
import { calcFees } from '../utils/fees';
import { useAppStore } from '../store/useAppStore';
import SharesInput from './SharesInput';
import TradePreview from './TradePreview';

interface Props {
  date: string;
  price: number;
  remainShares: number;
  onClose: () => void;
}

type SellTab = 'pct' | 'shares';
const PCT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function SellModal({ date, price, remainShares, onClose }: Props) {
  const addSell = useAppStore(s => s.addSell);
  const [sellPrice, setSellPrice] = useState(price);
  const [tab, setTab] = useState<SellTab>('pct');
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [sharesInput, setSharesInput] = useState<number | ''>(100);

  const sharesToSell = (() => {
    if (tab === 'pct' && selectedPct) {
      return Math.floor(remainShares * selectedPct / 100 / 100) * 100;
    }
    if (tab === 'shares' && typeof sharesInput === 'number') {
      return Math.round(sharesInput / 100) * 100;
    }
    return 0;
  })();

  const switchTab = (t: SellTab) => {
    setTab(t);
    if (t === 'pct') setSharesInput(100);
    else setSelectedPct(null);
  };

  const confirm = () => {
    if (isNaN(sellPrice) || sellPrice <= 0) { alert('请输入有效的减仓价格'); return; }
    if (sharesToSell < 100) { alert('卖出股数不足100股，请重新选择'); return; }
    if (sharesToSell > remainShares) { alert(`卖出股数（${sharesToSell}）超过持仓（${remainShares}）`); return; }
    const proceeds = sharesToSell * sellPrice;
    const fees = calcFees(proceeds, 'sell');
    const label = tab === 'pct' ? selectedPct + '%' : sharesToSell + '股';
    addSell({ date, price: sellPrice, shares: sharesToSell, proceeds, fees, label });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl p-7 w-[400px] shadow-2xl">
        <h3 className="text-lg font-bold text-gray-800 mb-1">📉 减仓操作</h3>
        <div className="text-xs text-gray-500 mb-4 leading-loose">
          日期：<strong className="text-gray-800">{date}</strong>　|
          当前持股：<strong className="text-gray-800">{remainShares} 股</strong>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-semibold text-gray-600 mb-1">减仓价格（元）</label>
          <input type="number" step="0.01" min="0.01"
            value={sellPrice}
            onChange={e => setSellPrice(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border-2 border-purple-400 rounded-md text-base font-bold text-purple-800 outline-none" />
        </div>

        <div className="flex border-b-2 border-gray-200 mb-3">
          {(['pct', 'shares'] as SellTab[]).map(t => (
            <button key={t} type="button"
              onClick={() => switchTab(t)}
              className={`px-5 py-2 text-sm font-semibold border-b-[3px] -mb-[2px] transition-colors
                ${tab === t ? 'text-purple-700 border-purple-700' : 'text-gray-400 border-transparent'}`}>
              {t === 'pct' ? '按百分比' : '按股数'}
            </button>
          ))}
        </div>

        {tab === 'pct' && (
          <div className="grid grid-cols-5 gap-2 mb-3">
            {PCT_OPTIONS.map(p => (
              <button key={p} type="button"
                onClick={() => setSelectedPct(p)}
                className={`py-2 rounded-md text-sm font-bold border-2 transition-all
                  ${selectedPct === p
                    ? 'bg-purple-600 text-white border-purple-700'
                    : 'bg-purple-50 text-purple-700 border-transparent hover:bg-purple-600 hover:text-white'}`}>
                {p}%
              </button>
            ))}
          </div>
        )}

        {tab === 'shares' && (
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-600 mb-1">卖出股数（整百股）</label>
            <SharesInput value={sharesInput} onChange={setSharesInput} variant="sell" max={remainShares} />
          </div>
        )}

        <div className="mb-4">
          <TradePreview shares={sharesToSell} price={sellPrice} type="sell" />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm">取消</button>
          <button onClick={confirm} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-bold">确认减仓</button>
        </div>
      </div>
    </div>
  );
}
