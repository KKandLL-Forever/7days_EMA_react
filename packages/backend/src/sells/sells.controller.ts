import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface SellRow {
  id: number;
  date: string;
  shares: number;
  price: number;
  proceeds: number;
  fees: number;
  label: string;
}

type NewSell = Omit<SellRow, 'id'>;

@Controller('api/sells')
export class SellsController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getAll(@Query('stockId', ParseIntPipe) stockId: number): SellRow[] {
    return this.db.raw
      .prepare('SELECT id, date, shares, price, proceeds, fees, label FROM sells WHERE stock_id = ? ORDER BY date, id')
      .all(stockId) as SellRow[];
  }

  @Post()
  create(
    @Query('stockId', ParseIntPipe) stockId: number,
    @Body() body: NewSell,
  ): SellRow {
    const result = this.db.raw
      .prepare('INSERT INTO sells (stock_id, date, shares, price, proceeds, fees, label) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(stockId, body.date, body.shares, body.price, body.proceeds, body.fees ?? 0, body.label ?? '');
    return { id: result.lastInsertRowid as number, ...body };
  }

  @Delete(':id')
  deleteOne(@Param('id', ParseIntPipe) id: number): { deleted: boolean } {
    const result = this.db.raw.prepare('DELETE FROM sells WHERE id = ?').run(id);
    return { deleted: result.changes > 0 };
  }
}
