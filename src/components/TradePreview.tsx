import { calcFees } from '../utils/fees';

interface Props {
  shares: number;
  price: number;
  type: 'buy' | 'sell';
}

export default function TradePreview({ shares, price, type }: Props) {
  if (shares <= 0) return <div className="p-2 bg-gray-50 rounded text-sm text-gray-400 min-h-[38px]">—</div>;

  const amount = shares * price;
  const fees = calcFees(amount, type);

  const feeDetail = type === 'buy'
    ? `佣金¥${fees.commission.toFixed(2)} + 过户¥${fees.transfer.toFixed(2)}`
    : `佣金¥${fees.commission.toFixed(2)} + 印花税¥${fees.stamp.toFixed(2)} + 过户¥${fees.transfer.toFixed(2)}`;

  return (
    <div className="p-2 bg-gray-50 rounded text-sm text-gray-600 min-h-[38px]">
      {type === 'buy' ? '买入' : '卖出'}{' '}
      <strong>{shares} 股</strong> × ¥{price.toFixed(2)} ={' '}
      <strong>¥{amount.toFixed(2)}</strong>
      <br />
      <span className="text-orange-500 text-xs">
        手续费：¥{fees.total.toFixed(2)}（{feeDetail}）
      </span>
    </div>
  );
}
