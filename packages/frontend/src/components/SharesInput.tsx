interface Props {
  value: number | '';
  onChange: (v: number | '') => void;
  variant?: 'buy' | 'sell';
  max?: number;
}

export default function SharesInput({ value, onChange, variant = 'buy', max }: Props) {
  const step = (delta: number) => {
    const cur = typeof value === 'number' ? value : 0;
    const next = Math.max(100, cur + delta);
    onChange(max ? Math.min(next, max) : next);
  };

  const isSell = variant === 'sell';
  const stepCls = isSell
    ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
    : 'bg-gray-100 text-gray-600 hover:bg-gray-200';

  return (
    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
      <button type="button" onClick={() => step(-100)}
        className={`px-4 py-2 text-lg font-bold border-r border-gray-300 ${stepCls}`}>−</button>
      <input
        type="number"
        value={value}
        step={100}
        min={100}
        max={max}
        placeholder="100"
        onChange={e => {
          const v = parseInt(e.target.value);
          onChange(isNaN(v) ? '' : v);
        }}
        onBlur={e => {
          const v = parseInt(e.target.value) || 0;
          const snapped = Math.max(100, Math.round(v / 100) * 100);
          onChange(max ? Math.min(snapped, max) : snapped);
        }}
        className="flex-1 text-center py-2 text-base font-bold outline-none min-w-0"
      />
      <button type="button" onClick={() => step(100)}
        className={`px-4 py-2 text-lg font-bold border-l border-gray-300 ${stepCls}`}>+</button>
    </div>
  );
}
