import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PriceData } from '@ema/shared';

@Controller('api/price-data')
export class PriceDataController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getAll(@Query('stockId', ParseIntPipe) stockId: number): PriceData[] {
    return this.db.raw
      .prepare('SELECT date, close FROM price_data WHERE stock_id = ? ORDER BY date')
      .all(stockId) as PriceData[];
  }

  @Post()
  upsertMany(
    @Query('stockId', ParseIntPipe) stockId: number,
    @Body() rows: PriceData[],
  ): { count: number } {
    const stmt = this.db.raw.prepare(
      'INSERT OR REPLACE INTO price_data (stock_id, date, close) VALUES (?, ?, ?)',
    );
    const insertMany = this.db.raw.transaction((items: PriceData[]) => {
      for (const item of items) {
        stmt.run(stockId, item.date, item.close);
      }
    });
    insertMany(rows);
    return { count: rows.length };
  }

  @Delete(':date')
  deleteOne(
    @Param('date') date: string,
    @Query('stockId', ParseIntPipe) stockId: number,
  ): { deleted: boolean } {
    const result = this.db.raw
      .prepare('DELETE FROM price_data WHERE stock_id = ? AND date = ?')
      .run(stockId, date);
    return { deleted: result.changes > 0 };
  }
}
