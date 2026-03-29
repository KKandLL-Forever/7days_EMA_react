import type { PriceData, BuyRecord, SellRecord, Stock } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

// ---- Capital ----
export const getCapital = () =>
  request<{ totalCapital: number }>('/capital');

export const setCapital = (totalCapital: number) =>
  request<{ totalCapital: number }>('/capital', {
    method: 'POST',
    body: JSON.stringify({ totalCapital }),
  });

export interface StockSummary {
  stockId: number;
  code: string;
  name: string;
  remainShares: number;
  totalInvested: number;
  totalProceeds: number;
  totalFees: number;
  latestClose: number;
}

export const getCapitalSummary = () =>
  request<StockSummary[]>('/capital/summary');

// ---- Stocks ----
export const getAllStocks = () =>
  request<Stock[]>('/stocks');

export const createStock = (code: string, name?: string) =>
  request<Stock>('/stocks', {
    method: 'POST',
    body: JSON.stringify({ code, name }),
  });

export const updateStock = (id: number, name: string) =>
  request<Stock>(`/stocks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

export const deleteStock = (id: number) =>
  request<{ deleted: boolean }>(`/stocks/${id}`, { method: 'DELETE' });

// ---- Price Data ----
export const getAllPriceData = (stockId: number) =>
  request<PriceData[]>(`/price-data?stockId=${stockId}`);

export const upsertPriceData = (rows: PriceData[], stockId: number) =>
  request<{ count: number }>(`/price-data?stockId=${stockId}`, {
    method: 'POST',
    body: JSON.stringify(rows),
  });

export const deletePriceDataRow = (date: string, stockId: number) =>
  request<{ deleted: boolean }>(`/price-data/${date}?stockId=${stockId}`, { method: 'DELETE' });

// ---- Buys ----
export const getAllBuys = (stockId: number) =>
  request<Array<{ id: number; date: string; shares: number; price: number; invested: number; fees: number }>>(`/buys?stockId=${stockId}`);

export const createBuy = (buy: Omit<BuyRecord, 'id'>, stockId: number) =>
  request<{ id: number }>(`/buys?stockId=${stockId}`, {
    method: 'POST',
    body: JSON.stringify({
      date: buy.date,
      shares: buy.shares,
      price: buy.price,
      invested: buy.invested,
      fees: buy.fees.total,
    }),
  });

export const deleteBuyById = (id: number) =>
  request<{ deleted: boolean }>(`/buys/${id}`, { method: 'DELETE' });

// ---- Sells ----
export const getAllSells = (stockId: number) =>
  request<Array<{ id: number; date: string; shares: number; price: number; proceeds: number; fees: number; label: string }>>(`/sells?stockId=${stockId}`);

export const createSell = (sell: Omit<SellRecord, 'id'>, stockId: number) =>
  request<{ id: number }>(`/sells?stockId=${stockId}`, {
    method: 'POST',
    body: JSON.stringify({
      date: sell.date,
      shares: sell.shares,
      price: sell.price,
      proceeds: sell.proceeds,
      fees: sell.fees.total,
      label: sell.label,
    }),
  });

export const deleteSellById = (id: number) =>
  request<{ deleted: boolean }>(`/sells/${id}`, { method: 'DELETE' });

// ---- Tushare ----
export const tushareFetch = (stockId: number, tsCode: string, startDate: string, endDate: string) =>
  request<{ count: number; message: string }>('/tushare/fetch', {
    method: 'POST',
    body: JSON.stringify({ stockId, tsCode, startDate, endDate }),
  });

// ---- Migration ----
export const migrateFromLocalStorage = (data: {
  settings: { totalCapital: number };
  priceData: PriceData[];
  buys: Array<{ id: number; date: string; shares: number; price: number; invested: number; fees: number }>;
  sells: Array<{ id: number; date: string; shares: number; price: number; proceeds: number; fees: number; label: string }>;
}) =>
  request<{ success: boolean }>('/migrate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
