import type { BuyRecord, SellRecord, PortfolioState } from '../types';

export function calcStateAt(date: string, buys: BuyRecord[], sells: SellRecord[]): PortfolioState {
  const b = buys.filter(x => x.date <= date);
  const s = sells.filter(x => x.date <= date);
  const totalShares   = b.reduce((n, x) => n + x.shares,   0);
  const soldShares    = s.reduce((n, x) => n + x.shares,   0);
  const totalInvested = b.reduce((n, x) => n + x.invested, 0);
  const totalProceeds = s.reduce((n, x) => n + x.proceeds, 0);
  const totalFees     = [...b, ...s].reduce((n, x) => n + (x.fees?.total ?? 0), 0);
  return {
    remainShares:  totalShares - soldShares,
    totalInvested,
    totalProceeds,
    totalFees,
  };
}
