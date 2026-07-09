# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Express server + Vite HMR on same port via middleware)
npm run dev

# Type-check (no emit) — primary quality gate; no automated tests exist
npm run check

# Build for production (Vite → dist/public, esbuild → dist/index.cjs)
npm run build

# Start production build
npm start

# Apply DB schema changes (Drizzle push — skips migrations in dev)
npm run db:push
```

## Architecture

### Multi-tenant platform
Two brands share one Railway deployment, one PostgreSQL database, and one Express server:
- **Chroma Travel** (`chromatravel.online`) — LGBT+ travel
- **Fénix Traveler** (`fenixtraveler.com`) — luxury travel

Brand is resolved per-request by `server/brand-middleware.ts` which reads the `Host` header and writes `req.brand` (type `BrandContext`). Brand data is cached in memory for 5 minutes; call `invalidateBrandCache()` after updates. Localhost defaults to `chroma`. The client reads brand from `/api/brand` via `client/src/lib/brand-context.tsx` — `useBrand()` hook → `{ brand, isChroma, isFenix }`. **Every page that shows brand-specific copy must use `useBrand()`.**

### Request flow
```
Cloudflare → Railway → Express (server/index.ts)
  → brand-middleware (sets req.brand)
  → routes.ts (main) + ota-b2c-routes.ts + automation-routes.ts + seo-routes.ts + rss-routes.ts
  → services/ (AI, CRM, bedbanks, loyalty, invoicing, attractions)
  → Drizzle ORM / raw pg.Pool → PostgreSQL (Neon)
  → (static) Vite-built assets in dist/public
```

Rate limiting is applied in `server/index.ts`: booking/lead/payment endpoints are capped at 10 req/min; public hotel/tarifa endpoints at 60 req/min.

### Database access pattern
`server/db.ts` exports `pool` and `db` that may be `null` when `DATABASE_URL` is unset. **Always use:**
- `getDb()` — throws `Error("Database not available")` if null; use inside request handlers
- `getPool()` — returns `pg.Pool | null`; guard with `if (!pool) return;` in background jobs

Never write `const { db } = await import("./db")` without also calling `getDb()`.

### Key shared code (`shared/`)
- **`schema.ts`** — single source of truth for all 30+ Drizzle tables. Tables use `varchar` PKs with `gen_random_uuid()` defaults. The `bloqueos` table is **raw SQL only** (not in schema.ts) — it lives in the DB created by `seed-bloqueos.ts` and managed with `pg.Pool` queries, never Drizzle.
- **`pricing-engine.ts`** — canonical pricing. **Never replicate this logic elsewhere.**

### Pricing engine (`shared/pricing-engine.ts`)
All prices in MXN. `tarifaPublicaPPPN` is per-person per-night from provider CSV.

```
tarifaPublicaTotal = tarifaPublicaPPPN × pax × noches    (or precioHabitacionTotal if passed)
tarifaNeta         = tarifaPublicaTotal × 0.85             (15% mayorista commission built-in)
precioVenta        = tarifaNeta × 1.05                     (5% agency margin — SPEI/cash price)
precioTarjeta      = precioVenta / (1 - 0.0418)            (divide method — agency always receives precioVenta)
```

**Clip surcharge is divide method** (`/ (1 - rate)`), never multiply — guarantees agency receives exactly `precioVenta` after Clip deducts. Clip effective rate: 3.6% × 1.16 IVA = 4.18%.

**Tier system** (by `tarifaNeta`):
| Tier | Neto | MSI plazos | Fénix Points |
|------|------|-----------|--------------|
| BASICO | < $12,000 | 3m only | 1% |
| MEDIO | $12,000–$34,999 | 3m, 6m | 2% |
| PREMIUM | ≥ $35,000 | 3m, 6m, 12m | 3% |

**MSI rules**: only full payment (`deposit.percent === 100`), minimum `precioVenta ≥ $7,000`, sobretasa embedded in client price. Clip 2026 MSI rates (with IVA): 3m=9.48%, 6m=12.96%, 12m=18.99%.

**Fénix Points redemption**: `kuaniDescuento` is capped at `gananciaAgencia` — the 5% margin is never sacrificed.

**Two-tier system (intentional, complementary):**
- **Booking tier** (`pricing-engine.ts`): BASICO/MEDIO/PREMIUM by `tarifaNeta` — determines MSI installment plans and % of Fénix Points earned per booking.
- **Loyalty tier** (`server/services/loyalty/index.ts`): Bronce/Plata/Oro/Platino/Diamante by accumulated points — determines discount % and point multipliers for future bookings.
They interact as follows: booking tier determines how many points are earned per booking; loyalty tier determines the multiplier applied on top and the benefits unlocked.

**AdSense**: Both brands share `googleAdsenseId: "ca-pub-9377043040912794"`. Revenue is not separated by brand by design — single publisher account. If separation is needed, create two AdSense sites under the same account.

Use `calcularPrecioBloqueo({ precioHabitacion, adultos, menores, juniors, infantes, noches })` as the entry point from server routes. The `precioHabitacion` argument must already be the **total for all nights** (multiply by `noches` before passing).

### Bloqueos (hotel inventory)
Raw SQL table `bloqueos` (not in Drizzle schema). Key columns: `hotel`, `tipo_habitacion`, `fecha_inicio`, `fecha_fin`, `tarifa_doble/sencilla/triple/cuadruple/primer_menor/junior` (all PPPN = per person per night), `habitaciones_disponibles`, `marca` (brand filter: `'chroma'|'fenix'|null` = shared).

`habitaciones_disponibles` is decremented atomically on hold and restored on expiry/cancellation. Always use `bloqueoId` (not hotel+room name) to reference a bloqueo in `reservas`.

### Booking (reservas) state machine
```
hold → pending_payment → confirmed
              ↓
     cancelled | expired
```
`reservas` table stores all pricing server-side (`precioVenta`, `precioTarjeta`, `depositAmount` etc.) — **never trust client-side prices**. Holds expire after 30 min (configurable via `HOLD_EXPIRY_MINUTES`). `server/jobs/hold-expiry.ts` runs every 5 min and atomically restores `habitaciones_disponibles`.

After `COMMIT`, call `loyaltyService.addPoints()` fire-and-forget — never await it inside the response path.

### Deposit calculation (`serverGetDeposit` in `routes.ts` + `server/modules/deposit.service.ts`)
- ≤ 10 days to check-in → 100% full payment (MSI eligible if precioVenta ≥ $7,000)
- ≤ 24 days → 70% deposit
- ≤ 89 days → 50% deposit
- > 89 days → 30% deposit

### Auth roles
`server/auth-middleware.ts` defines middleware: `requireAuth`, `requireAdmin`, `requireAgentOrAdmin`, `requireMarketing`, `requireRole(...roles)`. Session uses `connect-pg-simple` backed by `session` table (auto-created); falls back to `memorystore` when pool is null.

Roles: `customer | admin | agent | marketing`.

### Services
- **`server/services/bedbanks/`** — Hotelbeds provider (API key + HMAC signature). Falls back to mock data when unconfigured.
- **`server/services/gds/`** — Amadeus flight search.
- **`server/services/attractions/`** — Xcaret.
- **`server/services/loyalty/`** — Fénix Points / Kuani accounts, levels (Bronce→Diamante), transactions, rewards. `loyaltyService` is a singleton.
- **`server/services/crm/`** — Lead management, CSV import, WhatsApp sales automation, campaign execution, lead-to-customer conversion.
- **`server/services/ai/`** — Anthropic (Claude) + OpenAI providers via direct `fetch()` to APIs; `mock-provider.ts` for dev. AI powers the WhatsApp bot (`POST /api/webhooks/twilio/whatsapp`).
- **`server/services/notification.service.ts`** — CallMeBot WhatsApp + Nodemailer email. Env vars: `CALLMEBOT_APIKEY` (no hyphen) + `ADMIN_WHATSAPP`.
- **`server/services/invoicing/`** — CFDI invoice architecture (tables ready).

### Route files
- `server/routes.ts` — main routes: hotels, bloqueos/tarifas-especiales, reservar-precompra, leads, blog, auth, admin (ERP, stats, CRM, media, users).
- `server/ota-b2c-routes.ts` — inventory CSV upload, deposit calculator, Clip payment sessions + webhook, social share, agency B2B toggle.
- `server/automation-routes.ts` — CRM automation, campaigns.
- `server/seo-routes.ts` — sitemap, robots.txt, OpenGraph meta.
- `server/rss-routes.ts` — RSS/Atom/JSON feeds.

### Frontend
Wouter (not React Router). All routes defined in `client/src/App.tsx`. Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`, `@assets/` → `attached_assets/`.

UI components from shadcn/ui (Radix primitives). `client/src/components/ui/` holds all shadcn components. Forms use `react-hook-form` + `@hookform/resolvers` with Zod schemas.

`client/src/components/seo-head.tsx` (`SEOHead`) writes all meta tags. Canonical format: `https://www.{brandDomain}{pathname}`.

The main booking UX entry point is `client/src/components/tarifas-especiales-section.tsx` — the public rates grid + cotizador modal that calls `/api/reservar-precompra`.

### Blog system (dual-track)
Two parallel blog backends coexist — use whichever is appropriate per route:
- **`server/markdown-blog.ts`** — Loads posts from `/posts/*.md` with gray-matter front matter; mtime-based in-memory cache.
- **`server/static-blog.ts`** — Loads from `server/content/blog/posts.json`; used when no markdown files exist.

AI blog generation (`server/services/ai/blog-generator.service.ts`) writes SEO posts (title, slug, content, meta, tags, excerpt). The `AdminBlogGenerator` dashboard page drives this.

### Background jobs (`server/jobs/`)
All jobs are scheduled in `server/index.ts`. Do not add cron logic elsewhere.
- **`hold-expiry.ts`** — Every 5 min: expires holds and restores `habitaciones_disponibles`.
- **`automation.jobs.ts`** — CRM cron: birthday messages, cold-lead follow-up.
- **`campaign-dispatcher.ts`** — Every 5 min: dispatches pending `campaign_logs` via Twilio/Nodemailer; sets status `sent`/`failed`.
- **`cleanup-bloqueos.ts`** — Daily: deletes bloqueos with `fecha_inicio` < today + `CLEANUP_DAYS_AHEAD` (env, default 10).
- **`daily-report.ts`** — Daily 8am: WhatsApp report to admin (leads, revenue, pending holds, low stock).
- **`stock-alert.ts`** — Every 15 min: alerts admin when a bloqueo has ≤2 `habitaciones_disponibles` (deduped per bloqueo per day).
- **`weekly-newsletter.ts`** — Monday 9am: sends top 3 bloqueo offers to newsletter subscribers by email.

### AI services (`server/services/ai/`)
Provider abstraction in `provider.ts`; concrete implementations: `anthropic-provider.ts`, `openai-provider.ts`, `mock-provider.ts` (dev). Specialized service layer on top:
- **`blog-generator.service.ts`** — SEO blog post generation.
- **`smart-quoter.service.ts`** — Recommends bloqueos based on lead profile (destination, budget, dates, pax).
- **`campaign-copy.service.ts`** — Generates campaign copy with brand-appropriate tone (premium for Fénix, inclusive for Chroma).
- **`whatsapp-ai.service.ts`** — Drives the WhatsApp bot conversation flow.

### Bedbank providers (`server/services/bedbanks/providers/`)
Three providers available: Hotelbeds (primary, HMAC auth), TBO (`tbo-provider.ts`), Ratehawk (`ratehawk-provider.ts`). All fall back to mock data when env vars absent. `server/tbo-holidays.ts` defines the full TBO search→prebook→book→cancel type flow.

### Maintenance script
`scripts/weekly-maintenance.mjs` — run manually on Mondays (the session-start hook reminds you). Checks domain health, monitors hot leads and low stock, generates and publishes weekly blog post (alternating brand each week by ISO week parity), and writes CSV reports to `/reports/`.

### Admin users (`server/seed-brands.ts`)
- Chroma admin: `contacto@chromatravel.online`
- Fénix admin: `eric.cervantes@fenixtraveler.com`
- Password: value of `ADMIN_PASSWORD` env var; falls back to `Fenix2026!` if unset. The seed runs on every startup and **always updates** the password — re-deploying effectively resets it to `ADMIN_PASSWORD`.
- Admin role bypasses cross-brand login check — both accounts can log in from either domain.
- Emergency re-seed without redeploy: `POST /api/auth/reset-admin-seed` with header `X-Admin-Token: <ADMIN_API_TOKEN>`.

### Startup seeds (auto-run in `server/index.ts`)
1. `seed-brands.ts` — upserts Chroma + Fénix brand rows + admin users (resets passwords)
2. `seed-bloqueos.ts` — seeds 625 base inventory blocks if table is empty
3. `seed-bloqueos-fenix.ts` — upserts 409 Fénix 2026 bloqueos from embedded CSV data

## Deployment (Railway)

- **Build:** `npm ci --include=dev && npm run build` (nixpacks.toml)
- **Start:** `npm run db:push && npm start` — `db:push` is in both `railway.json` and `package.json start` script; runs on every deploy to create missing tables.
- **Node version:** 22.12.0 (`.nvmrc`); nixpacks.toml pins Node 20 — the `.nvmrc` value is for local dev only.
- **Health check:** `GET /api/health`
- **DATABASE_URL** must point to Railway's internal Postgres (`*.rlwy.net`), not Neon (`neon.tech`). If endpoints return `"endpoint has been disabled"`, the URL is pointing to a disabled Neon project — update it to the Railway Postgres connection string.
- Required env vars: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`; see `RAILWAY.md` for full list including Clip, TBO, Hotelbeds, SMTP, Twilio, Anthropic.

## Git

Active development branch: `claude/setup-chromatravel-crypto-8Z524` → merges to `main`.  
Railway auto-deploys from `main`. Local git proxy (127.0.0.1:35115) returns 403 on push — use full HTTPS URL with PAT:
```bash
git push https://<PAT>@github.com/chromatravelboutique-crypto/chromatravel.online.git <branch>
```
`commit.gpgsign` must be `false` globally (`git config --global commit.gpgsign false`) — the stop hook rejects GPG-unsigned commits otherwise.
