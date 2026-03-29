import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { PriceData, BuyRecord, SellRecord, Stock } from '../types';
import * as api from '../api/client';
import type { StockSummary } from '../api/client';

interface AppState {
  totalCapital: number;
  stocks: Stock[];
  activeStockId: number | null;
  priceData: PriceData[];
  buys: BuyRecord[];
  sells: SellRecord[];
  stockSummaries: StockSummary[];
  loading: boolean;

  loadAll: () => Promise<void>;
  loadStockData: (stockId: number) => Promise<void>;
  setActiveStock: (id: number) => Promise<void>;
  setTotalCapital: (v: number) => Promise<void>;

  createStock: (code: string, name?: string) => Promise<Stock>;
  deleteStock: (id: number) => Promise<void>;

  addPriceData: (d: PriceData) => Promise<void>;
  importPriceData: (data: PriceData[]) => Promise<void>;
  deletePriceData: (date: string) => Promise<void>;
  clearAllData: () => Promise<void>;

  clearBuys: () => Promise<void>;
  clearSells: () => Promise<void>;
  clearAllTrades: () => Promise<void>;
  addBuy: (buy: Omit<BuyRecord, 'id'>) => Promise<void>;
  addSell: (sell: Omit<SellRecord, 'id'>) => Promise<void>;
  deleteBuyById: (id: number) => Promise<void>;
  deleteSellById: (id: number) => Promise<void>;
}

function toFeeBreakdown(total: number) {
  return { commission: 0, stamp: 0, transfer: 0, total };
}

function requireStock(activeStockId: number | null): number {
  if (!activeStockId) throw new Error('请先选择或创建股票');
  return activeStockId;
}

export const useAppStore = create<AppState>()(
  immer((set, get) => ({
    totalCapital: 0,
    stocks: [],
    activeStockId: null,
    priceData: [],
    buys: [],
    sells: [],
    stockSummaries: [],
    loading: false,

    loadAll: async () => {
      set(s => { s.loading = true; });
      try {
        const [capital, stocks] = await Promise.all([
          api.getCapital(),
          api.getAllStocks(),
        ]);
        set(s => {
          s.totalCapital = capital.totalCapital;
          s.stocks = stocks;
        });

        // Auto-select first stock if available
        const firstStock = stocks[0];
        if (firstStock) {
          await get().loadStockData(firstStock.id);
          set(s => { s.activeStockId = firstStock.id; });
        }

        // Load global summaries
        const summaries = await api.getCapitalSummary();
        set(s => { s.stockSummaries = summaries; });
      } finally {
        set(s => { s.loading = false; });
      }
    },

    loadStockData: async (stockId: number) => {
      const [priceData, rawBuys, rawSells] = await Promise.all([
        api.getAllPriceData(stockId),
        api.getAllBuys(stockId),
        api.getAllSells(stockId),
      ]);
      set(s => {
        s.activeStockId = stockId;
        s.priceData = priceData;
        s.buys = rawBuys.map(b => ({
          id: b.id,
          date: b.date,
          shares: b.shares,
          price: b.price,
          invested: b.invested,
          fees: toFeeBreakdown(b.fees),
          label: `${b.shares}股`,
        }));
        s.sells = rawSells.map(x => ({
          id: x.id,
          date: x.date,
          shares: x.shares,
          price: x.price,
          proceeds: x.proceeds,
          fees: toFeeBreakdown(x.fees),
          label: x.label,
        }));
      });
    },

    setActiveStock: async (id: number) => {
      await get().loadStockData(id);
      // Refresh global summaries
      const summaries = await api.getCapitalSummary();
      set(s => { s.stockSummaries = summaries; });
    },

    setTotalCapital: async (v) => {
      await api.setCapital(v);
      set(s => { s.totalCapital = v; });
    },

    createStock: async (code, name) => {
      const stock = await api.createStock(code, name);
      set(s => { s.stocks.push(stock); });
      return stock;
    },

    deleteStock: async (id) => {
      await api.deleteStock(id);
      set(s => {
        s.stocks = s.stocks.filter(s => s.id !== id);
      });
      // If deleted stock was active, switch to first remaining stock
      const { stocks, activeStockId } = get();
      if (activeStockId === id) {
        const next = stocks[0];
        if (next) {
          await get().loadStockData(next.id);
        } else {
          set(s => {
            s.activeStockId = null;
            s.priceData = [];
            s.buys = [];
            s.sells = [];
          });
        }
      }
      const summaries = await api.getCapitalSummary();
      set(s => { s.stockSummaries = summaries; });
    },

    addPriceData: async (d) => {
      const stockId = requireStock(get().activeStockId);
      await api.upsertPriceData([d], stockId);
      set(s => {
        const idx = s.priceData.findIndex(p => p.date === d.date);
        if (idx >= 0) s.priceData[idx] = d;
        else s.priceData.push(d);
      });
    },

    importPriceData: async (data) => {
      const stockId = requireStock(get().activeStockId);
      await api.upsertPriceData(data, stockId);
      set(s => {
        const map = new Map(s.priceData.map(p => [p.date, p]));
        for (const d of data) map.set(d.date, d);
        s.priceData = Array.from(map.values());
      });
    },

    deletePriceData: async (date) => {
      const stockId = requireStock(get().activeStockId);
      await Promise.all([
        api.deletePriceDataRow(date, stockId),
        ...get().buys.filter(b => b.date === date).map(b => api.deleteBuyById(b.id)),
        ...get().sells.filter(x => x.date === date).map(x => api.deleteSellById(x.id)),
      ]);
      set(s => {
        s.priceData = s.priceData.filter(d => d.date !== date);
        s.buys = s.buys.filter(b => b.date !== date);
        s.sells = s.sells.filter(x => x.date !== date);
      });
    },

    clearAllData: async () => {
      const stockId = requireStock(get().activeStockId);
      const { buys, sells, priceData } = get();
      await Promise.all([
        ...buys.map(b => api.deleteBuyById(b.id)),
        ...sells.map(x => api.deleteSellById(x.id)),
        ...priceData.map(p => api.deletePriceDataRow(p.date, stockId)),
      ]);
      set(s => { s.priceData = []; s.buys = []; s.sells = []; });
    },

    clearBuys: async () => {
      const { buys } = get();
      await Promise.all(buys.map(b => api.deleteBuyById(b.id)));
      set(s => { s.buys = []; });
    },

    clearSells: async () => {
      const { sells } = get();
      await Promise.all(sells.map(x => api.deleteSellById(x.id)));
      set(s => { s.sells = []; });
    },

    clearAllTrades: async () => {
      const { buys, sells } = get();
      await Promise.all([
        ...buys.map(b => api.deleteBuyById(b.id)),
        ...sells.map(x => api.deleteSellById(x.id)),
      ]);
      set(s => { s.buys = []; s.sells = []; });
    },

    addBuy: async (buy) => {
      const stockId = requireStock(get().activeStockId);
      const result = await api.createBuy(buy, stockId);
      set(s => { s.buys.push({ id: result.id, ...buy }); });
      const summaries = await api.getCapitalSummary();
      set(s => { s.stockSummaries = summaries; });
    },

    addSell: async (sell) => {
      const stockId = requireStock(get().activeStockId);
      const result = await api.createSell(sell, stockId);
      set(s => { s.sells.push({ id: result.id, ...sell }); });
      const summaries = await api.getCapitalSummary();
      set(s => { s.stockSummaries = summaries; });
    },

    deleteBuyById: async (id) => {
      await api.deleteBuyById(id);
      set(s => { s.buys = s.buys.filter(b => b.id !== id); });
      const summaries = await api.getCapitalSummary();
      set(s => { s.stockSummaries = summaries; });
    },

    deleteSellById: async (id) => {
      await api.deleteSellById(id);
      set(s => { s.sells = s.sells.filter(x => x.id !== id); });
      const summaries = await api.getCapitalSummary();
      set(s => { s.stockSummaries = summaries; });
    },
  }))
);
