import { useState } from 'react';
import { migrateFromLocalStorage } from '../api/client';

interface Props {
  onDone: () => void;
}

export default function MigrateBanner({ onDone }: Props) {
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const lsKey = 'ema_calc_v1';
      const stored = localStorage.getItem(lsKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const state = parsed?.state ?? {};

      const data = {
        settings: { totalCapital: state.totalCapital ?? 0 },
        priceData: (state.priceData ?? []) as Array<{ date: string; close: number }>,
        buys: (state.buys ?? []).map((b: Record<string, unknown>, i: number) => ({
          id: i + 1,
          date: b.date as string,
          shares: b.shares as number,
          price: b.price as number,
          invested: b.invested as number,
          fees: typeof b.fees === 'object' && b.fees !== null
            ? (b.fees as { total: number }).total
            : (b.fees as number) ?? 0,
        })),
        sells: (state.sells ?? []).map((s: Record<string, unknown>, i: number) => ({
          id: i + 1,
          date: s.date as string,
          shares: s.shares as number,
          price: s.price as number,
          proceeds: s.proceeds as number,
          fees: typeof s.fees === 'object' && s.fees !== null
            ? (s.fees as { total: number }).total
            : (s.fees as number) ?? 0,
          label: (s.label as string) ?? '',
        })),
      };

      await migrateFromLocalStorage(data);
      localStorage.removeItem(lsKey);
      onDone();
    } catch (err) {
      alert('迁移失败: ' + String(err));
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    localStorage.removeItem('ema_calc_v1');
    onDone();
  };

  return (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center justify-between gap-4">
      <div className="text-sm text-amber-800">
        检测到本地缓存数据（旧版 localStorage），是否迁移到数据库？
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded disabled:opacity-50"
        >
          {migrating ? '迁移中...' : '迁移数据'}
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 border border-amber-400 text-amber-700 text-sm rounded hover:bg-amber-100"
        >
          丢弃
        </button>
      </div>
    </div>
  );
}
