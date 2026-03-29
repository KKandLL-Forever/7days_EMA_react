# EMA均线自动挂单价计算器

Monorepo with NestJS backend + React frontend + SQLite database.

## Structure

```
packages/
  shared/    — shared TypeScript types (@ema/shared)
  frontend/  — React + Vite + Tailwind CSS
  backend/   — NestJS + better-sqlite3
data/
  ema.db     — SQLite database (committed to git for cross-machine sync)
```

## Quick Start

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## Cross-machine sync

The `data/ema.db` file is committed to git. To sync data:

```bash
git add data/ema.db && git commit -m "chore: sync data" && git push
# on another machine:
git pull
```

## Build for production

```bash
npm run build
npm start   # serves both API and frontend from port 3001
```
