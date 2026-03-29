import type { FeeBreakdown } from '../types';

// A股费率
const CN_COMM_RATE = 0.0003;
const CN_MIN_COMMISSION = 5;
const CN_STAMP_RATE = 0.0005;
const CN_TRANSFER_RATE = 0.00001;

// 美股费率：买卖均为 0.132%，无印花税/过户费
const US_COMM_RATE = 0.00132;

export function calcFees(amount: number, type: 'buy' | 'sell'): FeeBreakdown {
  const commission = Math.max(amount * CN_COMM_RATE, CN_MIN_COMMISSION);
  const stamp = type === 'sell' ? amount * CN_STAMP_RATE : 0;
  const transfer = amount * CN_TRANSFER_RATE;
  const total = commission + stamp + transfer;
  return { commission, stamp, transfer, total };
}

export function calcFeesUS(amount: number): FeeBreakdown {
  const commission = amount * US_COMM_RATE;
  return { commission, stamp: 0, transfer: 0, total: commission };
}
