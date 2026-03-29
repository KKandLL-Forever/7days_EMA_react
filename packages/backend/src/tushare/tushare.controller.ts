import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface FetchParams {
  stockId: number;
  tsCode: string;      // e.g. "600519.SH"
  startDate: string;   // YYYYMMDD
  endDate: string;     // YYYYMMDD
}

interface TushareResponse {
  code: number;
  msg: string;
  data?: {
    fields: string[];
    items: Array<Array<string | number>>;
  };
}

function inferTsCode(code: string): string {
  const c = code.trim().toUpperCase();
  if (c.includes('.')) return c;
  if (/^6\d{5}$/.test(c)) return `${c}.SH`;
  if (/^[0239]\d{5}$/.test(c)) return `${c}.SZ`;
  if (/^[48]\d{5}$/.test(c)) return `${c}.BJ`;
  return c;
}

@Controller('api/tushare')
export class TushareController {
  constructor(private readonly db: DatabaseService) {}

  @Post('fetch')
  async fetchAndSave(@Body() body: FetchParams): Promise<{ count: number; message: string }> {
    const token = process.env.TUSHARE_TOKEN;
    if (!token) throw new BadRequestException('未配置 TUSHARE_TOKEN，请在 .env 文件中添加');

    const { stockId, startDate, endDate } = body;
    if (!stockId) throw new BadRequestException('stockId 不能为空');

    const tsCode = inferTsCode(body.tsCode);
    if (!tsCode) throw new BadRequestException('tsCode 不能为空');

    if (!/^\d{8}$/.test(startDate) || !/^\d{8}$/.test(endDate)) {
      throw new BadRequestException('日期格式应为 YYYYMMDD');
    }

    let tushareData: TushareResponse;
    try {
      const res = await fetch('http://api.tushare.pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_name: 'daily',
          token,
          params: { ts_code: tsCode, start_date: startDate, end_date: endDate },
          fields: 'trade_date,close',
        }),
      });
      tushareData = await res.json() as TushareResponse;
    } catch (e) {
      throw new InternalServerErrorException(`请求 Tushare 失败：${(e as Error).message}`);
    }

    if (tushareData.code !== 0) {
      throw new BadRequestException(`Tushare 错误：${tushareData.msg}`);
    }

    const { fields, items } = tushareData.data ?? { fields: [], items: [] };
    const dateIdx = fields.indexOf('trade_date');
    const closeIdx = fields.indexOf('close');

    if (dateIdx === -1 || closeIdx === -1) {
      throw new InternalServerErrorException('Tushare 返回数据字段缺失');
    }

    if (items.length === 0) {
      return { count: 0, message: '该时间段内无数据（可能是节假日或代码有误）' };
    }

    const rows = items.map(item => ({
      date: String(item[dateIdx]).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3'),
      close: Number(item[closeIdx]),
    }));

    const stmt = this.db.raw.prepare(
      'INSERT OR REPLACE INTO price_data (stock_id, date, close) VALUES (?, ?, ?)',
    );
    this.db.raw.transaction((r: typeof rows) => {
      for (const row of r) stmt.run(stockId, row.date, row.close);
    })(rows);

    return { count: rows.length, message: `成功导入 ${rows.length} 条数据` };
  }
}
