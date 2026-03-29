import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import * as api from '../api/client';

interface Props {
  onClose: () => void;
  onImported: () => void;
}

function inferTsCode(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.includes('.')) return c;
  if (/^6\d{5}$/.test(c)) return `${c}.SH`;
  if (/^[0239]\d{5}$/.test(c)) return `${c}.SZ`;
  if (/^[48]\d{5}$/.test(c)) return `${c}.BJ`;
  return c;
}

type Market = 'cn' | 'us';

function toYYYYMMDD(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 3);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function TushareModal({ onClose, onImported }: Props) {
  const { stocks, activeStockId, loadStockData } = useAppStore();
  const activeStock = stocks.find(s => s.id === activeStockId);

  const [market, setMarket] = useState<Market>('cn');
  const [tsCode, setTsCode] = useState(activeStock ? inferTsCode(activeStock.code) : '');
  const [startDate, setStartDate] = useState(defaultDates().start);
  const [endDate, setEndDate] = useState(defaultDates().end);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const handleFetch = async () => {
    const code = tsCode.trim();
    if (!code) { setError('请输入股票代码'); return; }
    if (!activeStockId || !activeStock) { setError('请先在顶部选择或创建股票'); return; }
    if (!startDate || !endDate) { setError('请选择日期范围'); return; }
    if (startDate > endDate) { setError('开始日期不能晚于结束日期'); return; }

    // Validate code matches active stock
    const normalizedInput = code.replace(/\.(SH|SZ|BJ)$/i, '').toUpperCase();
    const normalizedActive = activeStock.code.replace(/\.(SH|SZ|BJ)$/i, '').toUpperCase();
    if (normalizedInput !== normalizedActive) {
      setError(`代码「${code}」与当前选中股票「${activeStock.code}」不符，请先切换到对应股票标签`);
      return;
    }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await api.tushareFetch(
        activeStockId,
        code,
        toYYYYMMDD(startDate),
        toYYYYMMDD(endDate),
        market,
      );
      setResult(res.message);
      await loadStockData(activeStockId);
      if (res.count > 0) onImported();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '获取失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-1">📡 从 Tushare 获取行情</h3>
        <p className="text-xs text-gray-400 mb-4">数据来源：Tushare Pro，需在后端 .env 文件中配置 TUSHARE_TOKEN</p>

        {/* 市场选择 */}
        <div className="mb-4 flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          <button
            onClick={() => setMarket('cn')}
            className={`flex-1 py-2 font-medium transition-colors ${market === 'cn' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🇨🇳 A股
          </button>
          <button
            onClick={() => setMarket('us')}
            className={`flex-1 py-2 font-medium transition-colors ${market === 'us' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🇺🇸 美股
          </button>
        </div>

        {/* 股票代码 */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            股票代码
            {market === 'cn'
              ? <span className="text-gray-400 font-normal ml-1">（自动识别交易所后缀）</span>
              : <span className="text-gray-400 font-normal ml-1">（英文代码，如 AAPL）</span>
            }
          </label>
          <input
            type="text"
            placeholder={market === 'cn' ? '例：600519.SH 或 600519' : '例：AAPL、TSLA、NVDA'}
            value={tsCode}
            onChange={e => setTsCode(e.target.value.trim().toUpperCase())}
            onBlur={e => {
              const v = e.target.value.trim();
              if (market === 'cn' && v && !v.includes('.')) setTsCode(inferTsCode(v));
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 日期范围 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-600 mb-1">结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {result && <p className="text-sm text-green-600 mb-3">✓ {result}</p>}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
            关闭
          </button>
          <button
            onClick={handleFetch}
            disabled={loading || !tsCode.trim()}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 font-medium"
          >
            {loading ? '获取中...' : '获取数据'}
          </button>
        </div>
      </div>
    </div>
  );
}
