import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { parseCSV } from '../utils/csv';
import CreateStockModal from './CreateStockModal';
import TushareModal from './TushareModal';

export default function InputSection() {
  const { priceData, addPriceData, importPriceData, clearAllData, activeStockId } = useAppStore();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [close, setClose] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCreateStock, setShowCreateStock] = useState(false);
  const [showTushare, setShowTushare] = useState(false);

  const hasStock = activeStockId !== null;

  const handleAdd = () => {
    if (!hasStock) { alert('请先选择或创建股票'); return; }
    if (!date) { alert('请选择交易日期'); return; }
    const c = parseFloat(close);
    if (isNaN(c) || c <= 0) { alert('请输入有效的收盘价'); return; }
    if (priceData.some(d => d.date === date)) { alert('该日期数据已存在'); return; }
    addPriceData({ date, close: c });
    setClose('');
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    setDate(next.toISOString().split('T')[0]);
  };

  const handleCsvClick = () => {
    if (!hasStock) {
      // No active stock: force create one first
      setShowCreateStock(true);
    } else {
      fileRef.current?.click();
    }
  };

  const handleStockCreated = () => {
    setShowCreateStock(false);
    // After stock created, open file picker
    setTimeout(() => fileRef.current?.click(), 50);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const { data, result } = parseCSV(text, priceData);
      if (result.error) { alert(result.error); return; }
      importPriceData(data);
      alert(`导入完成：新增 ${result.added} 条，更新 ${result.skipped} 条`);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleClear = () => {
    if (!hasStock) return;
    if (confirm('确定要清空当前股票的所有行情和交易记录吗？')) {
      clearAllData();
      setDate(today);
      setClose('');
    }
  };

  return (
    <>
      <div className="flex gap-4 mb-6 flex-wrap items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block mb-2 font-semibold text-gray-600 text-sm">交易日期</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            disabled={!hasStock}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-40" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block mb-2 font-semibold text-gray-600 text-sm">当日收盘价</label>
          <input type="number" step="0.01" placeholder="请输入收盘价" value={close}
            disabled={!hasStock}
            onChange={e => setClose(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-40" />
        </div>
        <button onClick={handleAdd}
          disabled={!hasStock}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm whitespace-nowrap disabled:opacity-40">
          ➕ 添加数据
        </button>
        <button onClick={handleCsvClick}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm whitespace-nowrap">
          📂 导入CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        <button onClick={() => setShowTushare(true)}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm whitespace-nowrap">
          📡 Tushare
        </button>
        <button onClick={handleClear}
          disabled={!hasStock}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm whitespace-nowrap disabled:opacity-40">
          🗑️ 清空所有
        </button>
      </div>

      {showCreateStock && (
        <CreateStockModal
          onClose={() => setShowCreateStock(false)}
          onCreated={handleStockCreated}
        />
      )}

      {showTushare && (
        <TushareModal
          onClose={() => setShowTushare(false)}
          onImported={() => setShowTushare(false)}
        />
      )}
    </>
  );
}
