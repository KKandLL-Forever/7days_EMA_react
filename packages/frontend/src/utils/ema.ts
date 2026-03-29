import type { PriceData } from '../types';

export function calculateEMA(data: PriceData[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  const alpha = 2 / (period + 1);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j <= i; j++) sum += data[j].close;
      ema.push(sum / period);
    } else {
      ema.push(data[i].close * alpha + ema[i - 1]! * (1 - alpha));
    }
  }
  return ema;
}
