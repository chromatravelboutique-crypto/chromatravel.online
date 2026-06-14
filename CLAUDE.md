# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Express server + Vite HMR on same port via middleware)
npm run dev

# Type-check (no emit)
npm run check

# Build for production (Vite → dist/public, esbuild → dist/index.cjs)
npm run build

# Start production build
npm start

# Apply DB schema changes (Drizzle push — skips migrations in dev)
npm run db:push
```

There are **no automated tests** — `npm run check` (tsc) is the primary quality gate.

## Architecture

### Multi-tenant platform
Two brands share one Railway deployment, one PostgreSQL database, and one Express server:
- **Chroma Travel** (`chromatravel.online`) — LGBT+ travel
- **Fénix Traveler** (`fenixtraveler.com`) — luxury travel

Brand is resolved per-request via `server/middleware/brand-middleware.ts` (reads `Host` header, writes `req.brand`). The client reads brand from `/api/brand`, exposed through `client/src/lib/brand-context.tsx` (`useBrand()` hook → `{ brand, isChroma, isFenix }`). Every page that shows brand-specific copy **must** use `useBrand()`.

### Request flow
```
Cloudflare → Railway → Express (server/index.ts)
  → brand-middleware (sets req.brand)
  → routes.ts (main, 148KB) + ota-b2c-routes.ts + automation-routes.ts + seo-routes.ts + rss-routes.ts
  → services/ (AI, CRM, bedbanks, loyalty, invoicing, attractions)
  → Drizzle ORM → PostgreSQL (Neon)
  → (for static) Vite built assets in dist/public
```

### Key shared code (`shared/`)
- **`schema.ts`** — single source of truth for all 26+ Drizzle tables (users, brands, hotels, rooms, rates, reservas, bloqueos, leads, loyalty, campaigns, blog, etc.)
- **`pricing-engine.ts`** — canonical pricing logic: `calcularPrecioBloqueo()` applies `tarifaNeta = publica×0.85`, `precioVenta = neta×1.05`, Clip surcharge `×1.036`; Kuani points accrual. **Never replicate this logic elsewhere.**

### Booking state machine
`reservas` table holds: `hold → pending_payment → confirmed | cancelled | expired`.  
Holds expire after 30 min via `server/jobs/hold-expiry.ts` (runs every 5 min, atomically restores `habitaciones_disponibles` in `bloqueos`).  
`addPoints()` (Kuani loyalty) must be called **after** the DB COMMIT, fire-and-forget, never blocking the response.

### Hotel inventory
Raw SQL `bloqueos` table — hotel inventory blocks with `habitaciones_disponibles`. Pricing always goes through `calcularPrecioBloqueo()` in `shared/pricing-engine.ts`.

### Sessions
`connect-pg-simple` backed by the main PostgreSQL pool (`session` table, auto-created). Falls back to `memorystore` only if `pool` is null.

### Notifications
`server/services/notification.service.ts` — CallMeBot WhatsApp + Nodemailer email. Env vars: `CALLMEBOT_APIKEY` (no hyphen) + `ADMIN_WHATSAPP`.

### Frontend routing
Wouter (not React Router). All 51 routes defined in `client/src/App.tsx`. Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`.

### SEO / canonical
`client/src/components/seo-head.tsx` `SEOHead` component writes all meta tags dynamically (React effect). Canonical format: `https://www.{brandDomain}{pathname}`. The static `<link rel="canonical">` in `client/index.html` is a fallback only.

## Deployment (Railway)

- **Build:** Nixpacks runs `npm ci --include=dev && npm run build` (see `nixpacks.toml`)
- **Start:** `npm run db:push && npm start` (see `railway.json`)
- **Node version:** 22.12.0 (`.nvmrc`)
- **Health check:** `GET /api/health`
- Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`; see `RAILWAY.md` for full list

## Git

Active development branch: `claude/setup-chromatravel-crypto-8Z524` → merges to `main`.  
Railway auto-deploys from `main`. Local git proxy (127.0.0.1:35115) returns 403 on push — use full HTTPS URL with PAT:
```bash
git push https://<PAT>@github.com/chromatravelboutique-crypto/chromatravel.online.git <branch>
```
