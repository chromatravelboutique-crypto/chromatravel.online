# Guía de Despliegue en Railway — Chroma Travel / Fenix Traveler

## Resumen

Esta guía te lleva paso a paso desde cero hasta producción en Railway.
La app usa Node.js + PostgreSQL. Railway detecta ambas automáticamente gracias a `nixpacks.toml`.

---

## Paso 1: Subir el código a Railway

### Opción A — Desde GitHub (recomendado)
1. Descomprime el ZIP y sube el contenido a un repositorio GitHub (público o privado).
2. Ve a [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Selecciona tu repositorio y haz clic en **Deploy Now**.

### Opción B — Desde CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

---

## Paso 2: Agregar PostgreSQL

1. En tu proyecto Railway, clic en **"+ New"** → **Database** → **Add PostgreSQL**.
2. Railway crea la base de datos y provee `DATABASE_URL` automáticamente.

---

## Paso 3: Variables de Entorno

En Railway: tu servicio → **Variables** → **Raw Editor** — pega esto y rellena los valores reales:

```
# ─── Obligatorias ───────────────────────────────────────────────────────────
NODE_ENV=production
SESSION_SECRET=genera-una-clave-larga-y-aleatoria-aqui-minimo-64-chars
PORT=5000

# DATABASE_URL es provisto automáticamente por Railway al agregar PostgreSQL

# ─── Admin ──────────────────────────────────────────────────────────────────
ADMIN_PASSWORD=tu-contraseña-segura-de-admin

# ─── TBO Holidays (búsqueda de hoteles) ─────────────────────────────────────
TBO_BASE_URL=http://api.tbotechnology.in/TBOHolidays_HotelAPI
TBO_USERNAME=
TBO_PASSWORD=

# ─── Hotelbeds ───────────────────────────────────────────────────────────────
HOTELBEDS_API_KEY=
HOTELBEDS_SECRET=
HOTELBEDS_BASE_URL=https://api.test.hotelbeds.com

# ─── Clip (pagos México) ─────────────────────────────────────────────────────
CLIP_API_KEY=
CLIP_SECRET_KEY=
BASE_URL=https://tu-dominio.up.railway.app

# ─── PayPal ──────────────────────────────────────────────────────────────────
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_SANDBOX=false

# ─── Email / Nodemailer ──────────────────────────────────────────────────────
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@fenixtraveler.com

# ─── Twilio / WhatsApp Bot ───────────────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# ─── Claude AI (bot WhatsApp) ───────────────────────────────────────────────
ANTHROPIC_API_KEY=

# ─── Stripe (opcional) ───────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=

# ─── Google Analytics (opcional) ─────────────────────────────────────────────
VITE_GA_ID=
```

> **SESSION_SECRET**: genera uno seguro con `openssl rand -hex 64` en tu terminal.
> **BASE_URL**: usa el dominio final de tu servicio Railway (o dominio propio).

---

## Paso 4: Desplegar

Railway detecta `nixpacks.toml` y ejecuta automáticamente:
```
npm ci  →  npm run build  →  npm start
```

El primer despliegue tarda ~3-4 minutos (instala dependencias y compila).

---

## Paso 5: Base de Datos — Inicialización automática

Al arrancar por primera vez, el servidor ejecuta estas semillas automáticamente:
1. **Marcas**: Chroma Travel + Fenix Traveler con toda su configuración.
2. **Admins**: Crea los usuarios administradores con la contraseña de `ADMIN_PASSWORD`.
3. **Inventario base**: 625 bloqueos del catálogo original.
4. **Inventario Fenix 2026**: 409 grupos de bloqueos desde el CSV incluido (136 nuevos + 273 actualizados).
5. **Tablas auxiliares**: `inventory_logs`, `clip_payment_intents`, `agency_profiles` (se crean solas).

Si necesitas empujar el esquema completo manualmente:
```bash
railway run npm run db:push
```

---

## Paso 6: Dominio Personalizado

1. En Railway: tu servicio → **Settings** → **Domains** → **Add Custom Domain**.
2. Agrega los DNS records que Railway indique (CNAME).
3. Railway emite TLS automáticamente (Let's Encrypt).

**Multi-brand** — ambas marcas van al mismo servicio:
- `chromatravel.online` → servicio Railway
- `fenixtraveler.com`   → servicio Railway

El middleware detecta la marca por el header `host` de cada petición.

---

## Módulos disponibles

| Módulo | Ruta | Estado |
|--------|------|--------|
| Subida de inventario CSV/XLSX | `POST /api/admin/upload-inventory` | ✅ |
| Panel de inventario admin | `/admin/inventory` | ✅ |
| Calculadora de depósito | `POST /api/calculate-deposit` | ✅ |
| Pagos Clip + webhook HMAC | `/api/payments/clip/*` | ✅ |
| Social share iFrame (OG tags) | `GET /api/share/:blockId` | ✅ |
| Toggle agencia B2B + tarifas netas | `PATCH /api/admin/users/:id/agency` | ✅ |
| Re-seed Fenix (manual) | `POST /api/admin/inventory/seed-fenix` | ✅ |
| CRM + importación CSV | `/admin/crm` | ✅ |
| Lealtad Kueani | `/api/loyalty/*` | ✅ |
| Bot WhatsApp con Claude AI | `POST /api/webhooks/twilio/whatsapp` | ✅ |
| RSS + Atom + JSON Feed | `/feed/rss.xml` | ✅ |
| UTM tracking | `/api/utm/*` | ✅ |
| Sello RNT / SECTUR | Homepage | ✅ |
| Motor de búsqueda TBO+Hotelbeds | `POST /api/hotel-search` | ✅ |
| Cotizador modal con reserva | `POST /api/reservar-precompra` | ✅ |
| Facturas CFDI (arquitectura lista) | `/api/cfdi/*` | ✅ |

---

## Checklist pre-lanzamiento

- [ ] `SESSION_SECRET` configurado (mínimo 64 caracteres aleatorios)
- [ ] `DATABASE_URL` provisto automáticamente por Railway
- [ ] `ADMIN_PASSWORD` cambiado del valor por defecto
- [ ] `BASE_URL` apunta al dominio real (necesario para links de Clip)
- [ ] `SMTP_*` configurado para emails transaccionales
- [ ] Dominio personalizado apuntando al servicio
- [ ] Health check respondiendo: `GET /api/health`
- [ ] Webhook Twilio apuntando a: `POST https://tu-dominio/api/webhooks/twilio/whatsapp`
- [ ] Webhook Clip apuntando a: `POST https://tu-dominio/api/webhooks/clip`

---

## URLs de referencia rápida

| Recurso | URL |
|---------|-----|
| Panel admin | `/admin` |
| Inventario | `/admin/inventory` |
| CRM | `/admin/crm` |
| Health check | `/api/health` |
| RSS | `/feed/rss.xml` |
| Sitemap | `/sitemap.xml` |

---

## Soporte

- **Logs de producción**: Railway → tu servicio → **Observability** → **Logs**
- **Health check**: `GET https://tu-dominio.up.railway.app/api/health`
- **Reinicio manual**: Railway → tu servicio → **Settings** → **Restart**
