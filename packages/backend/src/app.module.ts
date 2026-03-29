import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { DatabaseModule } from './database/database.module';
import { CapitalController } from './capital/capital.controller';
import { PriceDataController } from './price-data/price-data.controller';
import { BuysController } from './buys/buys.controller';
import { SellsController } from './sells/sells.controller';
import { MigrateController } from './migrate/migrate.controller';
import { StocksController } from './stocks/stocks.controller';
import { TushareController } from './tushare/tushare.controller';

const imports = [DatabaseModule];

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  imports.push(
    ServeStaticModule.forRoot({
      rootPath: path.resolve(__dirname, '../../frontend/dist'),
      exclude: ['/api/(.*)'],
    }) as never,
  );
}

@Module({
  imports,
  controllers: [
    CapitalController,
    PriceDataController,
    BuysController,
    SellsController,
    MigrateController,
    StocksController,
    TushareController,
  ],
})
export class AppModule {}
