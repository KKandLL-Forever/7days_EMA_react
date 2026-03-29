export interface PriceData {
  date: string;   // YYYY-MM-DD
  close: number;
}

export interface BuyRecord {
  id: number;
  date: string;
  shares: number;
  price: number;
  invested: number;  // shares * price
  fees: number;
}

export interface SellRecord {
  id: number;
  date: string;
  shares: number;
  price: number;
  proceeds: number;  // shares * price
  fees: number;
  label: string;     // e.g. "25%" or "100股"
}

export interface Settings {
  totalCapital: number;
}

export interface AllData {
  settings: Settings;
  priceData: PriceData[];
  buys: BuyRecord[];
  sells: SellRecord[];
}
