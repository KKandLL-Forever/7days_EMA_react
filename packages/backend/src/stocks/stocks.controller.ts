import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus, ConflictException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface Stock {
  id: number;
  code: string;
  name: string;
  market: 'cn' | 'us';
  created_at: string;
}

@Controller('api/stocks')
export class StocksController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  getAll(): Stock[] {
    return this.db.raw
      .prepare('SELECT id, code, name, market, created_at FROM stocks ORDER BY created_at')
      .all() as Stock[];
  }

  @Post()
  create(@Body() body: { code: string; name?: string; market?: 'cn' | 'us' }): Stock {
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) throw new ConflictException('股票代码不能为空');
    const market = body.market === 'us' ? 'us' : 'cn';

    const existing = this.db.raw
      .prepare('SELECT id FROM stocks WHERE code = ?')
      .get(code);
    if (existing) throw new ConflictException(`股票代码 ${code} 已存在`);

    const result = this.db.raw
      .prepare('INSERT INTO stocks (code, name, market) VALUES (?, ?, ?)')
      .run(code, (body.name ?? '').trim(), market);
    return this.db.raw
      .prepare('SELECT id, code, name, market, created_at FROM stocks WHERE id = ?')
      .get(result.lastInsertRowid) as Stock;
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name: string },
  ): Stock {
    this.db.raw
      .prepare('UPDATE stocks SET name = ? WHERE id = ?')
      .run((body.name ?? '').trim(), id);
    return this.db.raw
      .prepare('SELECT id, code, name, market, created_at FROM stocks WHERE id = ?')
      .get(id) as Stock;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteOne(@Param('id', ParseIntPipe) id: number): { deleted: boolean } {
    // Cascade: delete price_data, buys, sells for this stock first
    const del = this.db.raw.transaction(() => {
      this.db.raw.prepare('DELETE FROM price_data WHERE stock_id = ?').run(id);
      this.db.raw.prepare('DELETE FROM buys WHERE stock_id = ?').run(id);
      this.db.raw.prepare('DELETE FROM sells WHERE stock_id = ?').run(id);
      const result = this.db.raw.prepare('DELETE FROM stocks WHERE id = ?').run(id);
      return result.changes > 0;
    });
    return { deleted: del() };
  }
}
