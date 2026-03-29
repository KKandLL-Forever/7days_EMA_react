import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CreateStockModal from './CreateStockModal';

export default function StockSelector() {
  const { stocks, activeStockId, setActiveStock, deleteStock } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);

  const activeStock = stocks.find(s => s.id === activeStockId);

  const handleDelete = (id: number, code: string) => {
    if (!confirm(`确定删除股票 ${code}？该股票的所有行情和交易记录将被清除！`)) return;
    deleteStock(id);
  };

  return (
    <div className="flex items-center gap-3 mb-5 flex-wrap">
      <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">当前股票：</span>

      {stocks.length === 0 ? (
        <span className="text-sm text-gray-400">暂无股票，请先添加</span>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {stocks.map(stock => (
            <div
              key={stock.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all ${
                stock.id === activeStockId
                  ? 'bg-blue-500 border-blue-500 text-white font-semibold'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
              onClick={() => setActiveStock(stock.id)}
            >
              <span>{stock.code}</span>
              {stock.name && <span className="opacity-75">· {stock.name}</span>}
              <button
                onClick={e => { e.stopPropagation(); handleDelete(stock.id, stock.code); }}
                className={`ml-1 text-xs leading-none hover:opacity-100 opacity-50 ${
                  stock.id === activeStockId ? 'text-white' : 'text-gray-500'
                }`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowCreate(true)}
        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 text-sm font-medium"
      >
        ＋ 添加股票
      </button>

      {activeStock && (
        <span className="text-xs text-gray-400 ml-auto">
          当前：{activeStock.code}{activeStock.name ? ` (${activeStock.name})` : ''}
        </span>
      )}

      {showCreate && (
        <CreateStockModal
          onClose={() => setShowCreate(false)}
          onCreated={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
