# Banco Ricco — Production Guide

## 1. Overview

Banco Ricco is a coffee pickup ordering system. It consists of:

- **apps/api** — NestJS + Prisma + PostgreSQL backend
- **apps/website** — Next.js 14 customer-facing storefront (Arabic RTL primary)
- **apps/admin** — Next.js 14 admin panel (Arabic RTL)
- **packages/** — Shared types, validators, config

## 2. Requirements

- **Node.js** 20+ (project tested with Node 20)
- **npm** 10+
- **PostgreSQL** 15+
- **Docker** (optional, for local PostgreSQL)

## 3. Environment Variables

### API (`apps/api/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **yes** | — | Strong random string for JWT signing |
| `JWT_EXPIRATION` | no | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | no | `7d` | Refresh token TTL |
| `API_PORT` | no | `4000` | API server port |
| `API_PREFIX` | no | `/api` | API path prefix |
| `ALLOWED_ORIGINS` | **yes** | `http://localhost:3000,...` | Comma-separated CORS origins |
| `ENABLE_SWAGGER` | no | `false` | Set to `true` to enable Swagger docs |
| `UPLOAD_DIR` | no | `./uploads` | Upload directory path |
| `NODE_ENV` | no | `development` | `production` for production |

### Website (`apps/website/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **yes** | — | API base URL (e.g. `https://api.example.com/api`) |
| `NEXT_PUBLIC_SITE_URL` | no | `http://localhost:3000` | Canonical site URL for SEO |

### Admin (`apps/admin/.env.local`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **yes** | — | API base URL |
| `NEXT_PUBLIC_WEBSITE_URL` | no | `http://localhost:3000` | Website URL for admin links |

## 4. Production Values

```
NODE_ENV=production
ENABLE_SWAGGER=false
ALLOWED_ORIGINS=https://example.com,https://admin.example.com
```

- `ALLOWED_ORIGINS` must contain **only** the actual production origins. Never include `localhost` in production.
- `JWT_SECRET` must be a strong random string (min 32 characters). Generate with:
  ```
  openssl rand -base64 64
  ```
- `DATABASE_URL` should use a strong password. Back up the connection string securely.

## 5. Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Build all packages and apps
npm run build

# Run tests
npm run test
npm run test:e2e

# Lint
npm run lint

# Type check
npm run typecheck

# Start in production (after build)
npm run start -w apps/api        # uses dist/main
npm run start -w apps/website     # next start
npm run start -w apps/admin       # next start
```

## 6. Database

- **Migration**: Prisma schema lives in `apps/api/prisma/schema.prisma`
- **Push schema**: `npm run db:push` (safe for dev; use migrations for prod)
- **Seed**: `npm run db:seed` creates admin user, currencies, categories, products, settings
- **Backup**: Schedule `pg_dump` of the production database
  ```bash
  pg_dump -U <user> -d <database> > backup_$(date +%Y%m%d).sql
  ```
- **Restore**:
  ```bash
  psql -U <user> -d <database> < backup.sql
  ```

## 7. Uploads

- Upload directory: `./uploads` (configurable via `UPLOAD_DIR`)
- Permissions: Ensure the process user can read/write
- Backup: Include uploads directory in backup strategy
- Reverse proxy: For production, serve uploaded files directly via nginx/Caddy rather than through Node.js. Example nginx:
  ```nginx
  location /uploads/ {
    alias /var/www/banco-ricco/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
  ```

## 8. Security Checklist

- [ ] Swagger disabled (`ENABLE_SWAGGER=false`)
- [ ] CORS restricted to known origins only
- [ ] JWT_SECRET is strong and rotated regularly
- [ ] Admin default password changed after seed
- [ ] Upload file type/size validation enabled
- [ ] HTTPS enforced (use reverse proxy with Let's Encrypt)
- [ ] API and frontend logs monitored
- [ ] Database backups scheduled
- [ ] Node.js and npm dependencies regularly updated
- [ ] CSP headers set on reverse proxy

## 9. Pre-launch Checklist

- [ ] `npm run build` passes for all apps
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] `npm run test:e2e` passes
- [ ] Arabic UX reviewed on mobile (RTL, spacing, font)
- [ ] Test guest order flow
- [ ] Test authenticated order flow
- [ ] Test admin order status flow
- [ ] Test reward claim flow
- [ ] Test contact form submission
- [ ] Test image upload (admin)
- [ ] Verify all environment variables are set in production
- [ ] Verify database backup works
- [ ] Verify uploads directory is writable
- [ ] Verify reverse proxy static file serving

## 10. Auth Strategy

Current implementation uses **localStorage** for token storage.

- Website stores `token` and `refreshToken` in localStorage
- Admin stores `admin_token` in localStorage
- Risks: XSS vulnerability, no httpOnly flag
- See `SECURITY_AUTH.md` for details and migration plan
