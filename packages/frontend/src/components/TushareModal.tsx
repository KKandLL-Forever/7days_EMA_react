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

  const [tsCode, setTsCode] = useState(activeStock ? inferTsCode(activeStock.code) : '');
  const [startDate, setStartDate] = useState(defaultDates().start);
  const [endDate, setEndDate] = useState(defaultDates().end);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const handleFetch = async () => {
    if (!activeStockId) { setError('请先选择股票'); return; }
    if (!tsCode.trim()) { setError('请输入 Tushare 股票代码'); return; }
    if (!startDate || !endDate) { setError('请选择日期范围'); return; }
    if (startDate > endDate) { setError('开始日期不能晚于结束日期'); return; }

    setLoading(true);
    setError('');
    setResult('');
    try {
      const res = await api.tushareFetch(
        activeStockId,
        tsCode.trim(),
        toYYYYMMDD(startDate),
        toYYYYMMDD(endDate),
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

        {/* 股票代码 */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Tushare 股票代码
            <span className="text-gray-400 font-normal ml-1">（自动识别交易所后缀）</span>
          </label>
          <input
            type="text"
            placeholder="例：600519.SH 或 600519"
            value={tsCode}
            onChange={e => setTsCode(e.target.value.trim().toUpperCase())}
            onBlur={e => {
              const v = e.target.value.trim();
              if (v && !v.includes('.')) setTsCode(inferTsCode(v));
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
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 font-medium"
          >
            {loading ? '获取中...' : '获取数据'}
          </button>
        </div>
      </div>
    </div>
  );
}
