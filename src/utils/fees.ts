import type { FeeBreakdown } from '../types';

const COMM_RATE = 0.0003;
const MIN_COMMISSION = 5;
const STAMP_RATE = 0.0005;
const TRANSFER_RATE = 0.00001;

export function calcFees(amount: number, type: 'buy' | 'sell'): FeeBreakdown {
  const commission = Math.max(amount * COMM_RATE, MIN_COMMISSION);
  const stamp = type === 'sell' ? amount * STAMP_RATE : 0;
  const transfer = amount * TRANSFER_RATE;
  const total = commission + stamp + transfer;
  return { commission, stamp, transfer, total };
}
