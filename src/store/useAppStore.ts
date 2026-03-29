import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PriceData, BuyRecord, SellRecord } from '../types';

interface AppState {
  totalCapital: number;
  priceData: PriceData[];
  buys: BuyRecord[];
  sells: SellRecord[];

  setTotalCapital: (v: number) => void;
  addPriceData: (d: PriceData) => void;
  importPriceData: (data: PriceData[]) => void;
  deletePriceData: (date: string) => void;
  clearAllData: () => void;
  addBuy: (buy: BuyRecord) => void;
  addSell: (sell: SellRecord) => void;
  deleteBuy: (index: number) => void;
  deleteSell: (index: number) => void;
  clearBuys: () => void;
  clearSells: () => void;
  clearAllTrades: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      totalCapital: 0,
      priceData: [],
      buys: [],
      sells: [],

      setTotalCapital: (v) => set(s => { s.totalCapital = v; }),
      addPriceData: (d) => set(s => { s.priceData.push(d); }),
      importPriceData: (data) => set(s => { s.priceData.push(...data); }),
      deletePriceData: (date) => set(s => {
        s.priceData = s.priceData.filter(d => d.date !== date);
        s.buys  = s.buys.filter(b => b.date !== date);
        s.sells = s.sells.filter(x => x.date !== date);
      }),
      clearAllData: () => set(s => { s.priceData = []; s.buys = []; s.sells = []; }),
      addBuy: (buy) => set(s => { s.buys.push(buy); }),
      addSell: (sell) => set(s => { s.sells.push(sell); }),
      deleteBuy: (index) => set(s => { s.buys.splice(index, 1); }),
      deleteSell: (index) => set(s => { s.sells.splice(index, 1); }),
      clearBuys: () => set(s => { s.buys = []; }),
      clearSells: () => set(s => { s.sells = []; }),
      clearAllTrades: () => set(s => { s.buys = []; s.sells = []; }),
    })),
    { name: 'ema_calc_v1' }
  )
);
