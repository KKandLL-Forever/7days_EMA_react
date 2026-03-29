import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface BuyRow {
  id: number;
  date: string;
  shares: number;
  price: number;
  invested: number;
  fees: number;
}

type NewBuy = Omit<BuyRow, 'id'>;

@Controller('api/buys')
export class BuysController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getAll(@Query('stockId', ParseIntPipe) stockId: number): BuyRow[] {
    return this.db.raw
      .prepare('SELECT id, date, shares, price, invested, fees FROM buys WHERE stock_id = ? ORDER BY date, id')
      .all(stockId) as BuyRow[];
  }

  @Post()
  create(
    @Query('stockId', ParseIntPipe) stockId: number,
    @Body() body: NewBuy,
  ): BuyRow {
    const result = this.db.raw
      .prepare('INSERT INTO buys (stock_id, date, shares, price, invested, fees) VALUES (?, ?, ?, ?, ?, ?)')
      .run(stockId, body.date, body.shares, body.price, body.invested, body.fees ?? 0);
    return { id: result.lastInsertRowid as number, ...body };
  }

  @Delete(':id')
  deleteOne(@Param('id', ParseIntPipe) id: number): { deleted: boolean } {
    const result = this.db.raw.prepare('DELETE FROM buys WHERE id = ?').run(id);
    return { deleted: result.changes > 0 };
  }
}
