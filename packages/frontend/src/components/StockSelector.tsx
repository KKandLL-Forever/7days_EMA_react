import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import CreateStockModal from './CreateStockModal';

export default function StockSelector() {
  const { stocks, activeStockId, setActiveStock, deleteStock } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);

  const activeStock = stocks.find(s => s.id === activeStockId);

  const handleSwitch = async (id: number) => {
    if (id === activeStockId || switchingId !== null) return;
    setSwitchingId(id);
    try {
      await setActiveStock(id);
    } finally {
      setSwitchingId(null);
    }
  };

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
          {stocks.map(stock => {
            const isActive = stock.id === activeStockId;
            const isLoading = switchingId === stock.id;
            return (
            <div
              key={stock.id}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                isLoading
                  ? 'bg-blue-300 border-blue-300 text-white cursor-wait'
                  : isActive
                  ? 'bg-blue-500 border-blue-500 text-white font-semibold cursor-default'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 cursor-pointer'
              }`}
              onClick={() => handleSwitch(stock.id)}
            >
              {isLoading
                ? <span className="animate-pulse">加载中…</span>
                : <><span>{stock.code}</span>{stock.name && <span className="opacity-75">· {stock.name}</span>}</>
              }
              {!isLoading && (
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(stock.id, stock.code); }}
                  className={`ml-1 text-xs leading-none hover:opacity-100 opacity-50 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  ✕
                </button>
              )}
            </div>
            );
          })}
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
