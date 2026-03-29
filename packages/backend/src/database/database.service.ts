import { Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db!: Database.Database;

  onModuleInit() {
    const dbPath = process.env.DB_PATH ?? path.resolve(__dirname, '../../../../..', 'data', 'ema.db');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate() {
    // v1: original tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS buys (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        date     TEXT NOT NULL,
        shares   INTEGER NOT NULL,
        price    REAL NOT NULL,
        invested REAL NOT NULL,
        fees     REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sells (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        date     TEXT NOT NULL,
        shares   INTEGER NOT NULL,
        price    REAL NOT NULL,
        proceeds REAL NOT NULL,
        fees     REAL NOT NULL DEFAULT 0,
        label    TEXT NOT NULL DEFAULT ''
      );
    `);

    // v2: multi-stock support
    // Create stocks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stocks (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        code       TEXT NOT NULL UNIQUE,
        name       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Migrate price_data: recreate with composite PK (stock_id, date)
    const hasPriceDataV2 = this.db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='price_data'`)
      .get() as { name: string } | undefined;

    const priceDataColumns = hasPriceDataV2
      ? (this.db.pragma('table_info(price_data)') as Array<{ name: string }>).map(c => c.name)
      : [];

    if (!hasPriceDataV2) {
      // Fresh install: create v2 directly
      this.db.exec(`
        CREATE TABLE price_data (
          stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
          date     TEXT NOT NULL,
          close    REAL NOT NULL,
          PRIMARY KEY (stock_id, date)
        );
        CREATE INDEX IF NOT EXISTS idx_price_data_stock ON price_data(stock_id);
      `);
    } else if (!priceDataColumns.includes('stock_id')) {
      // Existing install: migrate old price_data to new schema
      this.db.transaction(() => {
        // Ensure a default stock exists for old data
        this.db.exec(`INSERT OR IGNORE INTO stocks (id, code, name) VALUES (1, 'UNKNOWN', '未命名股票');`);

        this.db.exec(`
          CREATE TABLE price_data_v2 (
            stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
            date     TEXT NOT NULL,
            close    REAL NOT NULL,
            PRIMARY KEY (stock_id, date)
          );
          INSERT OR IGNORE INTO price_data_v2 (stock_id, date, close)
            SELECT 1, date, close FROM price_data;
          DROP TABLE price_data;
          ALTER TABLE price_data_v2 RENAME TO price_data;
          CREATE INDEX IF NOT EXISTS idx_price_data_stock ON price_data(stock_id);
        `);
      })();
    }

    // Add market column to stocks if missing (v3)
    const stocksColumns = (this.db.pragma('table_info(stocks)') as Array<{ name: string }>).map(c => c.name);
    if (!stocksColumns.includes('market')) {
      this.db.exec(`ALTER TABLE stocks ADD COLUMN market TEXT NOT NULL DEFAULT 'cn';`);
    }

    // Add stock_id to buys if missing
    const buysColumns = (this.db.pragma('table_info(buys)') as Array<{ name: string }>).map(c => c.name);
    if (!buysColumns.includes('stock_id')) {
      this.db.transaction(() => {
        this.db.exec(`INSERT OR IGNORE INTO stocks (id, code, name) VALUES (1, 'UNKNOWN', '未命名股票');`);
        this.db.exec(`
          ALTER TABLE buys ADD COLUMN stock_id INTEGER NOT NULL DEFAULT 1 REFERENCES stocks(id);
          CREATE INDEX IF NOT EXISTS idx_buys_stock ON buys(stock_id);
        `);
      })();
    }

    // Add stock_id to sells if missing
    const sellsColumns = (this.db.pragma('table_info(sells)') as Array<{ name: string }>).map(c => c.name);
    if (!sellsColumns.includes('stock_id')) {
      this.db.transaction(() => {
        this.db.exec(`INSERT OR IGNORE INTO stocks (id, code, name) VALUES (1, 'UNKNOWN', '未命名股票');`);
        this.db.exec(`
          ALTER TABLE sells ADD COLUMN stock_id INTEGER NOT NULL DEFAULT 1 REFERENCES stocks(id);
          CREATE INDEX IF NOT EXISTS idx_sells_stock ON sells(stock_id);
        `);
      })();
    }
  }

  get raw(): Database.Database {
    return this.db;
  }
}
