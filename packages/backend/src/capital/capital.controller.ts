import { Controller, Get, Post, Body } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface StockSummary {
  stockId: number;
  code: string;
  name: string;
  remainShares: number;
  totalInvested: number;
  totalProceeds: number;
  totalFees: number;
  latestClose: number;
}

@Controller('api/capital')
export class CapitalController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getCapital(): { totalCapital: number } {
    const row = this.db.raw
      .prepare("SELECT value FROM settings WHERE key = 'totalCapital'")
      .get() as { value: string } | undefined;
    return { totalCapital: row ? parseFloat(row.value) : 0 };
  }

  @Post()
  setCapital(@Body() body: { totalCapital: number }): { totalCapital: number } {
    this.db.raw
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('totalCapital', ?)")
      .run(String(body.totalCapital));
    return { totalCapital: body.totalCapital };
  }

  @Get('summary')
  getSummary(): StockSummary[] {
    const stocks = this.db.raw
      .prepare('SELECT id, code, name FROM stocks ORDER BY created_at')
      .all() as Array<{ id: number; code: string; name: string }>;

    return stocks.map(stock => {
      const buysRow = this.db.raw
        .prepare('SELECT COALESCE(SUM(shares),0) as shares, COALESCE(SUM(invested),0) as invested, COALESCE(SUM(fees),0) as fees FROM buys WHERE stock_id = ?')
        .get(stock.id) as { shares: number; invested: number; fees: number };

      const sellsRow = this.db.raw
        .prepare('SELECT COALESCE(SUM(shares),0) as shares, COALESCE(SUM(proceeds),0) as proceeds, COALESCE(SUM(fees),0) as fees FROM sells WHERE stock_id = ?')
        .get(stock.id) as { shares: number; proceeds: number; fees: number };

      const latestRow = this.db.raw
        .prepare('SELECT close FROM price_data WHERE stock_id = ? ORDER BY date DESC LIMIT 1')
        .get(stock.id) as { close: number } | undefined;

      return {
        stockId: stock.id,
        code: stock.code,
        name: stock.name,
        remainShares: buysRow.shares - sellsRow.shares,
        totalInvested: buysRow.invested,
        totalProceeds: sellsRow.proceeds,
        totalFees: buysRow.fees + sellsRow.fees,
        latestClose: latestRow?.close ?? 0,
      };
    });
  }
}
