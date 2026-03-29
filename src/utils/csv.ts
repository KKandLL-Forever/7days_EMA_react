import Papa from 'papaparse';
import type { PriceData } from '../types';

export interface ImportResult {
  added: number;
  skipped: number;
  error?: string;
}

export function parseCSV(text: string, existing: PriceData[]): { data: PriceData[]; result: ImportResult } {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const headers = parsed.meta.fields ?? [];

  const dateKey  = headers.find(h => ['时间', 'date', 'Date'].includes(h));
  const closeKey = headers.find(h => ['收盘', 'close', 'Close'].includes(h));

  if (!dateKey || !closeKey) {
    return { data: [], result: { added: 0, skipped: 0, error: '未找到"时间"或"收盘"列' } };
  }

  const existingDates = new Set(existing.map(d => d.date));
  const newData: PriceData[] = [];
  let skipped = 0;

  for (const row of parsed.data) {
    const date  = (row[dateKey] ?? '').trim().replace(/\//g, '-');
    const close = parseFloat((row[closeKey] ?? '').trim());
    if (!date || isNaN(close) || close <= 0) continue;
    if (existingDates.has(date)) { skipped++; continue; }
    newData.push({ date, close });
    existingDates.add(date);
  }

  return { data: newData, result: { added: newData.length, skipped } };
}
