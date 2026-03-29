export interface Stock {
  id: number;
  code: string;
  name: string;
  created_at: string;
}

export interface PriceData {
  date: string;   // YYYY-MM-DD
  close: number;
}

export interface FeeBreakdown {
  commission: number;
  stamp: number;
  transfer: number;
  total: number;
}

export interface BuyRecord {
  id: number;
  date: string;
  price: number;
  shares: number;
  invested: number;
  fees: FeeBreakdown;
  label: string;
}

export interface SellRecord {
  id: number;
  date: string;
  price: number;
  shares: number;
  proceeds: number;
  fees: FeeBreakdown;
  label: string;
}

export interface PortfolioState {
  remainShares: number;
  totalInvested: number;
  totalProceeds: number;
  totalFees: number;
}

export type ModalType = 'buy' | 'sell';

export interface ModalState {
  type: ModalType;
  date: string;
  price: number;
}
