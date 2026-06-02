# Banco Ricco ☕

A premium coffee pickup ordering platform built for Damascus. Arabic RTL primary.

## Apps

| App | Directory | Stack |
|---|---|---|
| API | `apps/api` | NestJS + Prisma + PostgreSQL |
| Website | `apps/website` | Next.js 14 + React 18 |
| Admin | `apps/admin` | Next.js 14 + React 18 (react-query, react-table) |
| Mobile (future) | `apps/mobile` | — |

## Development Setup

```bash
# Install dependencies
npm install

# Build shared packages
npm run build -w packages/types

# Generate Prisma client
npm run db:generate

# Push schema and seed database (requires PostgreSQL running)
npm run db:push
npm run db:seed

# Copy and configure environment variables
cp .env.example apps/api/.env
# Edit apps/api/.env with your database URL and secrets

# Start in development
npm run dev:api
npm run dev:website    # http://localhost:3000
npm run dev:admin      # http://localhost:3001
```

## Root Scripts

| Script | Description |
|---|---|
| `npm run dev:api` | Start API dev server |
| `npm run dev:website` | Start website dev server |
| `npm run dev:admin` | Start admin dev server |
| `npm run build` | Build all packages and apps |
| `npm run test` | Run API tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run lint` | Lint all apps |
| `npm run typecheck` | TypeScript check all apps |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with initial data |

## Production

See [PRODUCTION.md](./PRODUCTION.md) for deployment guide, environment variables, security checklist, and pre-launch checklist.
