import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface Props {
  onClose: () => void;
  onCreated: (stockId: number) => void;
  /** 创建完成后是否自动切换到新股票（默认 true） */
  autoSwitch?: boolean;
}

export default function CreateStockModal({ onClose, onCreated, autoSwitch = true }: Props) {
  const { createStock, setActiveStock } = useAppStore();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<'cn' | 'us'>('cn');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    const trimCode = code.trim().toUpperCase();
    if (!trimCode) { setError('股票代码不能为空'); return; }
    setLoading(true);
    setError('');
    try {
      const stock = await createStock(trimCode, name.trim(), market);
      if (autoSwitch) await setActiveStock(stock.id);
      onCreated(stock.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4">添加股票</h3>

        {/* 市场 */}
        <div className="mb-3 flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setMarket('cn')}
            className={`flex-1 py-2 font-medium transition-colors ${market === 'cn' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🇨🇳 A股
          </button>
          <button
            type="button"
            onClick={() => setMarket('us')}
            className={`flex-1 py-2 font-medium transition-colors ${market === 'us' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            🇺🇸 美股
          </button>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            股票代码 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="例：600519"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoFocus
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            股票名称 <span className="text-gray-400 font-normal">（可选）</span>
          </label>
          <input
            type="text"
            placeholder="例：贵州茅台"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? '创建中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}
