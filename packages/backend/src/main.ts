import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Load .env by walking up from __dirname until found
function loadEnv() {
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (key && !(key in process.env)) process.env[key] = value;
      }
      return;
    }
    dir = path.dirname(dir);
  }
}
loadEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: 'http://localhost:5173' });

  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();
