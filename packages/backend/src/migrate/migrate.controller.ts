import { Controller, Post, Body } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AllData } from '@ema/shared';

@Controller('api/migrate')
export class MigrateController {
  constructor(private readonly db: DatabaseService) {}

  @Post()
  migrate(@Body() data: AllData): { success: boolean } {
    const db = this.db.raw;

    // Ensure UNKNOWN stock exists and get its id
    db.prepare(`INSERT OR IGNORE INTO stocks (id, code, name) VALUES (1, 'UNKNOWN', '未命名股票')`).run();
    const defaultStockId = 1;

    const insertPrice = db.prepare(
      'INSERT OR REPLACE INTO price_data (stock_id, date, close) VALUES (?, ?, ?)',
    );
    const insertBuy = db.prepare(
      'INSERT OR IGNORE INTO buys (id, stock_id, date, shares, price, invested, fees) VALUES (?, ?, ?, ?, ?, ?, ?)',
    );
    const insertSell = db.prepare(
      'INSERT OR IGNORE INTO sells (id, stock_id, date, shares, price, proceeds, fees, label) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    const setCapital = db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('totalCapital', ?)",
    );

    db.transaction(() => {
      setCapital.run(String(data.settings.totalCapital));
      for (const p of data.priceData) {
        insertPrice.run(defaultStockId, p.date, p.close);
      }
      for (const b of data.buys) {
        insertBuy.run(b.id, defaultStockId, b.date, b.shares, b.price, b.invested, b.fees ?? 0);
      }
      for (const s of data.sells) {
        insertSell.run(s.id, defaultStockId, s.date, s.shares, s.price, s.proceeds, s.fees ?? 0, s.label ?? '');
      }
    })();

    return { success: true };
  }
}
